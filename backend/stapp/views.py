from django.shortcuts import render
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import models
from django.db.models import Sum

from .models import *
import json
import random
import string
from decimal import Decimal
from django.contrib.auth.hashers import make_password
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, MobileTokenObtainPairSerializer, AdminTokenSerializer, WithdrawRequestSerializer, DepositRequestSerializer, DepositActionSerializer, ReferralCommissionSerializer
from django.utils import timezone
from datetime import timedelta
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .permissions import IsActiveUser
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404

from rest_framework.permissions import IsAdminUser, IsAuthenticated

def generate_referral_code(username, mobile):
    """Generate a unique referral code based on username and mobile"""
    # Take first 3 chars of username and last 4 digits of mobile
    username_part = username[:3].upper() if username else "USR"
    mobile_part = mobile[-4:] if mobile and len(mobile) >= 4 else "0000"

    # Add 2 random characters for uniqueness
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=2))

    return f"{username_part}{mobile_part}{random_part}"

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            mobile = data.get('mobile')
            email = data.get('email')
            password = data.get('password')
            referral_code = data.get('referral_code', '')

            # Check if user already exists
            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists'}, status=400)

            if User.objects.filter(mobile=mobile).exists():
                return JsonResponse({'error': 'Mobile number already exists'}, status=400)

            # Generate unique referral code for new user
            new_referral_code = generate_referral_code(username, mobile)

            # Ensure referral code is unique
            while User.objects.filter(referral_code=new_referral_code).exists():
                new_referral_code = generate_referral_code(username, mobile)

            # Create user and set referred_by if referral_code is given
            user = User.objects.create(
                username=username,
                mobile=mobile,
                email=email,
                password=make_password(password),
                referral_code=new_referral_code,
                referred_by=referral_code if referral_code else None
            )

            # Create wallet for user
            Wallet.objects.create(user=user)

            # Generate JWT tokens for newly registered user
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return JsonResponse({
                'message': 'User registered successfully',
                'token': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'mobile': user.mobile,
                    'email': user.email,
                    'referral_code': user.referral_code
                }
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ...existing code...
from django.contrib.auth.hashers import check_password

@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            mobile = data.get('mobile')
            password = data.get('password')

            if not mobile or not password:
                return JsonResponse({'error': 'Mobile and password are required'}, status=400)

            try:
                user = User.objects.get(mobile=mobile)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Invalid mobile number or password'}, status=401)

            if not user.is_active:
                return JsonResponse({
                    'error': 'Aapko admin ke dwara block kar diya gaya hai.',
                    'blocked': True
                }, status=403)

            if not check_password(password, user.password):
                return JsonResponse({'error': 'Invalid mobile number or password'}, status=401)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token

            return JsonResponse({
                'message': 'Login successful',
                'token': str(access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'mobile': user.mobile,
                    'email': user.email,
                    'referral_code': user.referral_code
                }
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
# ...existing code...


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def get_user_profile(request):
    try:
        user = request.user
        # Generate referral code if it doesn't exist
        if not user.referral_code:
            user.referral_code = generate_referral_code(user.username, user.mobile)
            user.save()

       
            
        return Response({
            'id': user.id,
            'username': user.username,
            'mobile': user.mobile,
            'email': user.email,
            'referral_code': user.referral_code,
            
            'date_joined': user.date_joined,
            'status': 'active' if user.is_active else 'blocked' 
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)
from .serializers import WalletSerializer


def get_user_wallet(user):
        wallet, created = Wallet.objects.get_or_create(user=user)
        return wallet

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def get_wallet_balance(request):
    try:
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveUser])
def place_bet(request):
    try:
        from .game_timing import GameTimingManager
    
        data = request.data
        game_name = data.get('game_name')
        number = data.get('number')
        amount = Decimal(str(data.get('amount', 0)))
        bet_type = data.get('bet_type', 'number')
        number = data.get('number')
        india_tz = pytz.timezone('Asia/Kolkata')
        now = timezone.now().astimezone(india_tz)

        # --- Secure min/max bet logic ---
        if amount < 10:
            return Response({'error': 'Minimum bet amount is ₹10.'}, status=400)
        if amount > 10000:
            return Response({'error': 'Maximum bet amount is ₹10,000.'}, status=400)

        if game_name:
            game_name = game_name.upper()

        print(f"[DEBUG] Incoming bet: game={game_name}, number={number}, amount={amount}, bet_type={bet_type}, user={request.user}")

        timing_manager = GameTimingManager()
        is_locked = timing_manager.is_game_locked(game_name)
        next_open = timing_manager.get_next_open_time(game_name)
        print(f"[DEBUG] is_game_locked={is_locked}, next_open_time={next_open}")

        open_dt, close_dt, _ = get_game_time_window(game_name)  # ✅ Fix
        now = timezone.localtime()
        print(f"[DEBUG] {game_name} session: {open_dt} to {close_dt}, NOW: {now}")

        if open_dt is None or close_dt is None:
            print(f"[DEBUG] Invalid game name or timings not set for {game_name}")
            return Response({'error': 'Invalid game name or timings not set.'}, status=400)

        if is_locked:
            print(f"[DEBUG] Bet rejected: {game_name} is locked.")
            return Response({
                'error': f'{game_name.title()} is currently locked. Please wait for next opening time.',
                'next_open_time': next_open
            }, status=400)

        # Check if user has sufficient balance (balance + bonus + winnings)
        try:
            wallet = Wallet.objects.get(user=request.user)
        except Wallet.DoesNotExist:
            print("[DEBUG] Wallet not found for user.")
            return Response({'error': 'Wallet not found'}, status=404)

        total_balance = wallet.balance + wallet.bonus + wallet.winnings
        print(f"[DEBUG] User balance: {wallet.balance}, bonus: {wallet.bonus}, winnings: {wallet.winnings}, total: {total_balance}")

        if total_balance < amount:
            print(f"[DEBUG] Bet rejected: Insufficient balance ({total_balance} < {amount})")
            return Response({'error': 'Insufficient balance'}, status=400)

        # Deduct amount from wallet (prefer balance, then winnings, then bonus)
        left = amount
        if wallet.balance >= left:
            wallet.balance -= left
            left = Decimal('0.00')
        else:
            left -= wallet.balance
            wallet.balance = Decimal('0.00')

        if left > 0:
            if wallet.winnings >= left:
                wallet.winnings -= left
                left = Decimal('0.00')
            else:
                left -= wallet.winnings
                wallet.winnings = Decimal('0.00')

        if left > 0:
            if wallet.bonus >= left:
                wallet.bonus -= left
                left = Decimal('0.00')
            else:
                print(f"[DEBUG] Bet rejected: Insufficient balance after all deductions.")
                return Response({'error': 'Insufficient balance.'}, status=400)

        wallet.save()

        # Create bet record
        bet = Bet.objects.create(
            user=request.user,
            game_name=game_name,
            number=number,
            amount=amount,
            bet_type=bet_type,
            session_start=open_dt,
            session_end=close_dt,
        )
        print(f"[DEBUG] Bet created: id={bet.id}")

        print(f"[DEBUG] Bet placed successfully for user {request.user}")
        return Response({
            'message': 'Bet placed successfully',
            'bet_id': bet.id,
            'remaining_balance': str(wallet.balance + wallet.bonus + wallet.winnings)
        })

    except Exception as e:
        import traceback
        print("[DEBUG] Exception in place_bet:", traceback.format_exc())
        return Response({'error': str(e)}, status=500)
    
# ...existing code...

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def declare_result(request):
    try:
        data = request.data
        game_name = data.get('game_name', '').strip().upper()
        winning_number_raw = str(data.get('winning_number', '')).strip()
        open_dt, close_dt, result_dt = get_game_time_window(game_name)
        now = timezone.localtime()

        # Secure: Check session window
        if not open_dt or not close_dt:
            return Response({'error': 'No active session found for this game.'}, status=400)

        # Diamond King: Only allow result in result window
        if game_name == "DIAMOND KING":
            if not result_dt or not (close_dt < now <= result_dt):
                print(f"[DEBUG] Diamond King: close_dt={close_dt}, now={now}, result_dt={result_dt}")
                return Response({'error': 'Result can only be declared in result window.'}, status=400)

        # Secure: Validate winning number
        if not (winning_number_raw.isdigit() and 0 <= int(winning_number_raw) <= 100):
            return Response({'error': 'Valid winning number (00-100) required'}, status=400)
        winning_number = str(winning_number_raw).zfill(2)

        DeclaredResult.objects.create(
            game_name=game_name,
            winning_number=winning_number
        )

        # Get current session bets only
        bets = Bet.objects.filter(
            game_name__iexact=game_name,
            status='pending',
            created_at__gte=open_dt,
            created_at__lte=close_dt
        )

        andar_digit = int(winning_number[0])
        bahar_digit = int(winning_number[-1])

        commission_games = ['FARIDABAD', 'GALI', 'DISAWER', 'GHAZIABAD']

        for bet in bets:
            payout = Decimal('0.00')
            is_win = False

            if bet.bet_type == 'number' and str(bet.number).zfill(2) == winning_number:
                payout = bet.amount * 90
                is_win = True
            elif bet.bet_type == 'andar' and int(bet.number) == andar_digit:
                payout = bet.amount * 9
                is_win = True
            elif bet.bet_type == 'bahar' and int(bet.number) == bahar_digit:
                payout = bet.amount * 9
                is_win = True

            wallet = get_user_wallet(bet.user)
            if is_win:
                wallet.winnings += payout
                bet.status = 'won'
            else:
                bet.status = 'lost'

            # --- Commission Logic: 10% of bet amount for commission_games, always for "number" bet ---
            if game_name in commission_games and bet.bet_type == 'number':
                if bet.user.referred_by:
                    try:
                        referrer = User.objects.get(referral_code=bet.user.referred_by)
                        commission_amount = bet.amount * Decimal('0.10')
                        referrer_wallet = Wallet.objects.get(user=referrer)
                        referrer_wallet.bonus += commission_amount
                        referrer_wallet.save()
                        ReferralCommission.objects.create(
                            referrer=referrer,
                            referred_user=bet.user,
                            commission=commission_amount,
                            commission_type='bet_commission',
                            bet=bet
                        )
                    except User.DoesNotExist:
                        pass

            wallet.save()
            bet.is_win = is_win
            bet.payout = payout
            bet.save()

        return Response({'message': f'Results declared for {game_name} - Winning number: {winning_number}'})

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)

# ...existing code...



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from datetime import timedelta
from django.utils import timezone
from .models import DeclaredResult


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def declare_result_history(request):
    try:
        two_months_ago = timezone.now() - timedelta(days=60)
        results = DeclaredResult.objects.filter(declared_at__gte=two_months_ago).order_by('-declared_at')

        data = [
            {
                "gameName": result.game_name,
                "winningNumber": result.winning_number,
                "date": result.declared_at.strftime('%Y-%m-%d')
            }
            for result in results
        ]

        return Response(data)

    except Exception as e:
        return Response({"error": str(e)}, status=500)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'referral_code': user.referral_code
            }, status=201)
        return Response(serializer.errors, status=400)
    
    
class MobileLoginView(TokenObtainPairView):
    serializer_class = MobileTokenObtainPairSerializer

class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenSerializer

# API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    return get_user_profile(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveUser])
def withdraw_request(request):
    try:
        amount = Decimal(str(request.data.get('amount', 0)))
        wallet = Wallet.objects.get(user=request.user)
        
        if amount < 100:
            return Response({'error': 'Minimum withdrawal amount is ₹100.'}, status=400)
        if amount > 30000:
            return Response({'error': 'Maximum withdrawal amount is ₹30,000.'}, status=400)

        # Only winnings can be withdrawn
        if wallet.winnings < amount:
            return Response({'error': 'Insufficient winnings balance.'}, status=400)

        # Deduct from winnings immediately
        wallet.winnings -= amount
        wallet.save()

        # Create withdraw request
        withdraw_req = WithdrawRequest.objects.create(
            user=request.user,
            amount=amount
        )

        # Create pending transaction for withdraw
        Transaction.objects.create(
            user=request.user,
            transaction_type='withdraw',
            amount=amount,
            status='pending',
            note='Withdraw request submitted'
        )

        return Response({'message': 'Withdraw request submitted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)



import pytz

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def transaction_history(request):
    try:
        ist = pytz.timezone('Asia/Kolkata')
        transactions = Transaction.objects.filter(user=request.user).order_by('-created_at')
        data = []
        for txn in transactions:
            created_at_ist = txn.created_at.astimezone(ist)
            data.append({
                'id': txn.id,
                'type': txn.transaction_type,
                'amount': str(txn.amount),
                'status': txn.status,  # pending, approved, rejected
                'created_at': created_at_ist.strftime('%d-%m-%Y %I:%M %p')  # Indian date & time
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
from datetime import datetime, timedelta
from django.utils import timezone

def generate_diamond_king_sessions():
    """
    Diamond King session times:
    - Session 1: 06:00 - 07:50 (Result: 08:00)
    - Session 2: 08:10 - 09:50 (Result: 10:00)
    - Session 3: 10:10 - 11:50 (Result: 12:00)
    - Session 4: 12:10 - 13:50 (Result: 14:00)
    - Session 5: 14:10 - 15:50 (Result: 16:00)
    - Session 6: 16:10 - 17:50 (Result: 18:00)
    - Session 7: 18:10 - 19:50 (Result: 20:00)
    - Session 8: 20:10 - 21:50 (Result: 22:00)
    - Session 9: 22:10 - 23:50 (Result: 23:59)
    """
    sessions = []
    # Session times as per your frontend
    session_times = [
        ("06:00", "07:50", "08:00"),
        ("08:10", "09:50", "10:00"),
        ("10:10", "11:50", "12:00"),
        ("12:10", "13:50", "14:00"),
        ("14:10", "15:50", "16:00"),
        ("16:10", "17:50", "18:00"),
        ("18:10", "19:50", "20:00"),
        ("20:10", "21:50", "22:00"),
        ("22:10", "23:50", "23:59"),
    ]
    for idx, (open_time, close_time, result_time) in enumerate(session_times):
        sessions.append({
            "session_no": idx + 1,
            "open": open_time,
            "close": close_time,
            "result": result_time,
            "open_time": open_time,      # <-- Add these keys for compatibility
            "close_time": close_time,
            "result_time": result_time,
        })
    return sessions

# GAME_TIMINGS me koi change nahi, bas function call yahi se ho
GAME_TIMINGS = {
    "JAIPUR KING": {"open": "21:00", "close": "16:50"},
    "FARIDABAD": {"open": "22:00", "close": "17:40"},
    "GHAZIABAD": {"open": "23:00", "close": "19:50"},
    "GALI": {"open": "04:00", "close": "22:30"},
    "DISAWER": {"open": "07:00", "close": "02:30"},
    "DIAMOND KING": generate_diamond_king_sessions()
}

from datetime import datetime, timedelta
from django.utils import timezone

import pytz

def get_game_time_window(game_name):
    ist = pytz.timezone('Asia/Kolkata')
    now = timezone.now().astimezone(ist)
    timings = GAME_TIMINGS.get(game_name.upper())
    if not timings:
        return None, None, None

    if isinstance(timings, list):
        today = now.date()
        for session in timings:
            open_time = datetime.strptime(session["open"], "%H:%M").time()
            close_time = datetime.strptime(session["close"], "%H:%M").time()
            result_time = datetime.strptime(session["result"], "%H:%M").time()
            open_dt = ist.localize(datetime.combine(today, open_time))
            close_dt = ist.localize(datetime.combine(today, close_time))
            result_dt = ist.localize(datetime.combine(today, result_time))
            if close_time < open_time:
                close_dt += timedelta(days=1)
                result_dt += timedelta(days=1)
            if open_dt <= now <= result_dt:
                return open_dt, close_dt, result_dt
        return None, None, None

    today = now.date()
    open_time = datetime.strptime(timings["open"], "%H:%M").time()
    close_time = datetime.strptime(timings["close"], "%H:%M").time()
    open_dt = ist.localize(datetime.combine(today, open_time))
    close_dt = ist.localize(datetime.combine(today, close_time))
    if close_time <= open_time:
        if now.time() >= open_time:
            close_dt += timedelta(days=1)
        else:
            open_dt -= timedelta(days=1)
    return open_dt, close_dt, None





def calculate_diamond_king_payouts(bets):
    """
    Returns: payout_map (number: total_payout), total_bet, all_possible_numbers
    """
    payout_map = {}
    total_bet = 0
    all_numbers = set(str(i).zfill(2) for i in range(0, 101))  # 00 to 100

    for bet in bets:
        num = str(bet.number).zfill(2)
        payout = 0
        if bet.bet_type == 'number':
            payout = bet.amount * 90
        elif bet.bet_type == 'andar':
            payout = bet.amount * 9
        elif bet.bet_type == 'bahar':
            payout = bet.amount * 9
        payout_map[num] = payout_map.get(num, 0) + payout
        total_bet += bet.amount

    # Ensure all numbers are present in payout_map (for zero bet numbers)
    for num in all_numbers:
        if num not in payout_map:
            payout_map[num] = 0

    return payout_map, total_bet, all_numbers


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def view_bets_current_session(request):
    try:
        now = timezone.localtime()
        data = []
        for game_name in GAME_TIMINGS:
            if GAME_TIMINGS[game_name] is None:
                continue
            open_dt, close_dt, result_dt = get_game_time_window(game_name)
            # Session ka end time (Diamond King me result_dt, baaki me close_dt)
            session_end = result_dt if result_dt else close_dt
            # Only show bets if current time is in session window
            if open_dt and session_end and open_dt <= now <= session_end:
                bets = Bet.objects.filter(
                    user=request.user,
                    game_name__iexact=game_name,
                    created_at__gte=open_dt,
                    created_at__lte=session_end
                )
                for bet in bets:
                    data.append({
                        'id': bet.id,
                        'game': bet.game_name,
                        'number': bet.number,
                        'amount': str(bet.amount),
                        'bet_type': bet.bet_type,
                        'status': bet.status if hasattr(bet, 'status') else 'pending',
                        'created_at': bet.created_at.isoformat(),
                        'session_start': bet.session_start,
                        'session_end': bet.session_end,
                    })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

from datetime import timedelta
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def view_bets_history(request):
    try:
        # Only last 7 days
        seven_days_ago = timezone.now() - timedelta(days=6)
        bets = Bet.objects.filter(
            user=request.user,
            created_at__date__gte=seven_days_ago.date()
        ).order_by('-created_at')

        data = []
        for bet in bets:
            data.append({
                'id': bet.id,
                'game': bet.game_name,
                'number': bet.number,
                'amount': str(bet.amount),
                'bet_type': bet.bet_type,
                'status': 'won' if bet.is_win else 'lost',
                'winning_number': getattr(bet, 'winning_number', None),
                'timestamp': bet.session_end if hasattr(bet, 'session_end') and bet.session_end else bet.created_at,
                'session_start': bet.session_start if hasattr(bet, 'session_start') else None,
                'session_end': bet.session_end if hasattr(bet, 'session_end') else None,
                'created_at': bet.created_at,
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)




@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def user_bet_history(request):
    try:
        bets = Bet.objects.filter(user=request.user).order_by('-created_at')
        data = []
        for bet in bets:
            data.append({
                'id': bet.id,
                'game': bet.game,
                'number': bet.number,
                'amount': str(bet.amount),
                'status': 'won' if bet.is_win else 'lost',
                'payout': str(bet.payout) if bet.payout else '0',
                'created_at': bet.created_at
            })
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Bet
from datetime import datetime, timedelta

# ...existing code...

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bet_records(request):
    game = request.GET.get("game")
    if not game:
        return Response({"error": "Game not specified"}, status=400)

    ist = pytz.timezone('Asia/Kolkata')
    now = timezone.now().astimezone(ist)
    game_upper = game.upper()
    timings = GAME_TIMINGS.get(game_upper)
    sessions_data = []

    if not timings:
        return Response({"error": "Invalid game name or timings not set."}, status=400)

    def bet_to_dict(bet):
        # Only one of these will be filled per bet
        return {
            "id": bet.id,
            "user": bet.user.username,
            "number": str(bet.number).zfill(2) if bet.bet_type == "number" else "",
            "andar_number": str(bet.number) if bet.bet_type == "andar" else "",
            "bahar_number": str(bet.number) if bet.bet_type == "bahar" else "",
            "amount": float(bet.amount) if bet.bet_type == "number" else 0,
            "andarAmount": float(bet.amount) if bet.bet_type == "andar" else 0,
            "baharAmount": float(bet.amount) if bet.bet_type == "bahar" else 0,
            "bet_type": bet.bet_type,
            "status": bet.status,
            "created_at": bet.created_at.astimezone(ist).strftime('%d-%m-%Y %I:%M %p'),
        }

    # Diamond King: Multiple sessions
    if isinstance(timings, list):
        today = now.date()
        current_idx = None
        for idx, session in enumerate(timings):
            open_time = datetime.strptime(session["open"], "%H:%M").time()
            close_time = datetime.strptime(session["close"], "%H:%M").time()
            open_dt = ist.localize(datetime.combine(today, open_time))
            close_dt = ist.localize(datetime.combine(today, close_time))
            if close_time < open_time:
                close_dt += timedelta(days=1)
            if open_dt <= now <= close_dt:
                current_idx = idx
                break
        if current_idx is None:
            for idx, session in reversed(list(enumerate(timings))):
                open_time = datetime.strptime(session["open"], "%H:%M").time()
                open_dt = ist.localize(datetime.combine(today, open_time))
                if open_dt <= now:
                    current_idx = idx
                    break
            if current_idx is None:
                current_idx = 0

        # Current session
        session = timings[current_idx]
        open_time = datetime.strptime(session["open"], "%H:%M").time()
        close_time = datetime.strptime(session["close"], "%H:%M").time()
        result_time = datetime.strptime(session["result"], "%H:%M").time()
        open_dt = ist.localize(datetime.combine(today, open_time))
        close_dt = ist.localize(datetime.combine(today, close_time))
        result_dt = ist.localize(datetime.combine(today, result_time))
        if close_time < open_time:
            close_dt += timedelta(days=1)
            result_dt += timedelta(days=1)

        bets = Bet.objects.filter(
            game_name__iexact=game_upper,
            created_at__gte=open_dt,
            created_at__lte=close_dt
        ).order_by('created_at')

        bet_list = [bet_to_dict(bet) for bet in bets]

        sessions_data.append({
            "type": "current",
            "session_no": current_idx + 1,
            "date": open_dt.strftime('%Y-%m-%d'),
            "open_time": session["open"],
            "close_time": session["close"],
            "result_time": session["result"],
            "bets": bet_list
        })

        # Previous session
        prev_idx = (current_idx - 1) % len(timings)
        prev_session = timings[prev_idx]
        prev_open_time = datetime.strptime(prev_session["open"], "%H:%M").time()
        prev_close_time = datetime.strptime(prev_session["close"], "%H:%M").time()
        prev_result_time = datetime.strptime(prev_session["result"], "%H:%M").time()
        prev_open_dt = ist.localize(datetime.combine(today, prev_open_time))
        prev_close_dt = ist.localize(datetime.combine(today, prev_close_time))
        prev_result_dt = ist.localize(datetime.combine(today, prev_result_time))
        if prev_close_time < prev_open_time:
            prev_close_dt += timedelta(days=1)
            prev_result_dt += timedelta(days=1)

        prev_bets = Bet.objects.filter(
            game_name__iexact=game_upper,
            created_at__gte=prev_open_dt,
            created_at__lte=prev_close_dt
        ).order_by('created_at')

        prev_bet_list = [bet_to_dict(bet) for bet in prev_bets]

        sessions_data.append({
            "type": "previous",
            "session_no": prev_idx + 1,
            "date": prev_open_dt.strftime('%Y-%m-%d'),
            "open_time": prev_session["open"],
            "close_time": prev_session["close"],
            "result_time": prev_session["result"],
            "bets": prev_bet_list
        })

        return Response({game_upper: {"sessions": sessions_data},"current_ist": now.strftime("%Y-%m-%dT%H:%M:%S")})

    # Other games: Single session per day
    else:
        today = now.date()
        open_time = datetime.strptime(timings["open"], "%H:%M").time()
        close_time = datetime.strptime(timings["close"], "%H:%M").time()
        open_dt = ist.localize(datetime.combine(today, open_time))
        close_dt = ist.localize(datetime.combine(today, close_time))
        if close_time < open_time:
            close_dt += timedelta(days=1)

        bets = Bet.objects.filter(
            game_name__iexact=game_upper,
            created_at__gte=open_dt,
            created_at__lte=close_dt
        ).order_by('created_at')

        bet_list = [bet_to_dict(bet) for bet in bets]

        sessions_data.append({
            "type": "current",
            "date": open_dt.strftime('%Y-%m-%d'),
            "open_time": timings["open"],
            "close_time": timings["close"],
            "bets": bet_list
        })

        yesterday = today - timedelta(days=1)
        prev_open_dt = ist.localize(datetime.combine(yesterday, open_time))
        prev_close_dt = ist.localize(datetime.combine(yesterday, close_time))
        if close_time < open_time:
            prev_close_dt += timedelta(days=1)

        prev_bets = Bet.objects.filter(
            game_name__iexact=game_upper,
            created_at__gte=prev_open_dt,
            created_at__lte=prev_close_dt
        ).order_by('created_at')

        prev_bet_list = [bet_to_dict(bet) for bet in prev_bets]

        sessions_data.append({
            "type": "previous",
            "date": prev_open_dt.strftime('%Y-%m-%d'),
            "open_time": timings["open"],
            "close_time": timings["close"],
            "bets": prev_bet_list
        })

        return Response({game_upper: {"sessions": sessions_data}})

# ...existing code...

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_withdraw_requests(request):
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        requests = WithdrawRequest.objects.all().order_by('-created_at')
        serializer = WithdrawRequestSerializer(requests, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_withdraw_action(request):
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        withdraw_id = request.data.get('withdraw_id')
        action = request.data.get('action')

        if not withdraw_id or action not in ['approve', 'reject']:
            return Response({'error': 'Invalid request data'}, status=400)

        withdraw_request = WithdrawRequest.objects.get(id=withdraw_id)
        wallet = Wallet.objects.get(user=withdraw_request.user)

        if action == 'approve':
            # Amount already deducted from winnings at request time, so just approve
            withdraw_request.is_approved = True
            withdraw_request.approved_at = timezone.now()

            # Create transaction record for approved withdrawal
            Transaction.objects.create(
                user=withdraw_request.user,
                transaction_type='withdraw',
                amount=withdraw_request.amount,
                status='approved',
                note='Withdrawal approved'
            )

        else:  # reject
            withdraw_request.is_rejected = True

            # Refund winnings if rejected
            wallet.winnings += withdraw_request.amount
            wallet.save()

            # Create transaction record for rejected withdrawal
            Transaction.objects.create(
                user=withdraw_request.user,
                transaction_type='withdraw',
                amount=withdraw_request.amount,
                status='rejected',
                note='Withdrawal rejected'
            )

        withdraw_request.save()
        return Response({'message': f'Withdrawal request {action}d successfully'})

    except WithdrawRequest.DoesNotExist:
        return Response({'error': 'Withdrawal request not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_transactions(request):
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        transactions = []

        # Get all Transaction records
        transaction_records = Transaction.objects.all().order_by('-created_at')
        for txn in transaction_records:
            transactions.append({
                'id': txn.id,
                'user': {
                    'username': txn.user.username,
                    'mobile': txn.user.mobile
                },
                'transaction_type': txn.transaction_type,
                'amount': str(txn.amount),
                'status': txn.status,
                'created_at': txn.created_at.isoformat(),
                'note': txn.note or ''
            })

        # Get all DepositRequest records
        deposit_requests = DepositRequest.objects.all().order_by('-created_at')
        for deposit in deposit_requests:
            transactions.append({
                'id': f'dep_{deposit.id}',
                'user': {
                    'username': deposit.user.username,
                    'mobile': deposit.user.mobile
                },
                'transaction_type': 'deposit',
                'amount': str(deposit.amount),
                'status': deposit.status,
                'created_at': deposit.created_at.isoformat(),
                'note': f'UTR: {deposit.utr_number}'
            })

        # Get all WithdrawRequest records
        withdraw_requests = WithdrawRequest.objects.all().order_by('-created_at')
        for withdraw in withdraw_requests:
            status = 'approved' if withdraw.is_approved else 'rejected' if withdraw.is_rejected else 'pending'
            transactions.append({
                'id': f'with_{withdraw.id}',
                'user': {
                    'username': withdraw.user.username,
                    'mobile': withdraw.user.mobile
                },
                'transaction_type': 'withdraw',
                'amount': str(withdraw.amount),
                'status': status,
                'created_at': withdraw.created_at.isoformat(),
                'note': ''
            })

        # Sort all transactions by created_at in descending order
        transactions.sort(key=lambda x: x['created_at'], reverse=True)

        return Response(transactions)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveUser])
def user_deposit_request(request):
    try:
        data = request.data
        amount = Decimal(str(data.get('amount', 0)))
        utr_number = data.get('utr_number', '').strip()
        payment_method = data.get('payment_method', 'UPI').strip()

        # Validate amount
        if amount < Decimal('100.00'):
            return Response({'error': 'Minimum deposit amount is ₹100.'}, status=400)
        if amount > Decimal('30000.00'):
            return Response({'error': 'Maximum deposit limit is ₹30,000. You cannot deposit above ₹30,000 in a single request.'}, status=400)

        # Validate UTR number
        if not (utr_number.isdigit() and len(utr_number) == 12):
            return Response({'error': 'UTR number must be 12 digits.'}, status=400)

        # Check for duplicate UTR in pending or approved deposits
        if DepositRequest.objects.filter(utr_number=utr_number, status__in=['pending', 'approved']).exists():
            return Response({'error': 'This UTR number has already been used.'}, status=400)

        user = request.user
        is_first_deposit = not DepositRequest.objects.filter(user=user).exists()
        ref_comm = ReferralCommission.objects.filter(referred_user=user, commission_type='signup_bonus').exists()
        # Bonus tabhi milega jab pehla deposit ho raha ho, user referred ho, aur bonus pehle nahi mila ho

        # Create deposit request
        deposit = DepositRequest.objects.create(
            user=user,
            amount=amount,
            utr_number=utr_number,
            payment_method=payment_method,
            status='pending'
        )

        # Create transaction record
        Transaction.objects.create(
            user=user,
            transaction_type='deposit',
            amount=amount,
            status='pending',
            note=f'Deposit request - UTR: {utr_number}',
            related_deposit=deposit
        )

        return Response({
            'message': 'Deposit request submitted for admin approval.',
            'request_id': deposit.id,
            'status': deposit.status,
            'amount': str(deposit.amount),
            'payment_method': deposit.payment_method
        }, status=201)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Deposit request error: {str(e)}", exc_info=True)

        return Response({
            'error': 'Failed to process deposit request',
            'details': str(e)
        }, status=500)
    


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_deposit_requests(request):
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        requests = DepositRequest.objects.all().order_by('-created_at')
        serializer = DepositRequestSerializer(requests, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_deposit_action(request):
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=403)

    try:
        deposit_id = request.data.get('deposit_id')
        action = request.data.get('action')
        admin_note = request.data.get('note', '')

        if not deposit_id or action not in ['approve', 'reject']:
            return Response({'error': 'Invalid request data'}, status=400)

        deposit = DepositRequest.objects.get(id=deposit_id)
        
        if deposit.status != 'pending':
            return Response({'error': 'Deposit request already processed'}, status=400)

        if action == 'approve':
            # Approve deposit
            deposit.status = 'approved'
            deposit.approved_at = timezone.now()
            deposit.approved_by = request.user
            deposit.save()

            # Add funds to wallet
            wallet = Wallet.objects.get(user=deposit.user)
            wallet.balance += deposit.amount
            wallet.save()

            user = deposit.user
            is_first_deposit = not DepositRequest.objects.filter(
                user=user, status='approved'
            ).exclude(id=deposit.id).exists()

            already_referred = ReferralCommission.objects.filter(
                referred_user=user, commission_type='signup_bonus'
            ).exists()

            if is_first_deposit and not already_referred and user.referred_by:
                try:
                    referrer = User.objects.get(referral_code=user.referred_by)
                    referrer_wallet, _ = Wallet.objects.get_or_create(user=referrer)
                    referrer_wallet.bonus += Decimal('50.00')
                    referrer_wallet.save()

                    ReferralCommission.objects.create(
                        referrer=referrer,
                        referred_user=user,
                        commission=Decimal('50.00'),
                        commission_type='signup_bonus'
                    )
                except User.DoesNotExist:
                    pass

            # Update transaction record
            Transaction.objects.filter(
                user=deposit.user,
                amount=deposit.amount,
                status='pending'
            ).update(
                status='approved',
                note=f'Deposit approved - UTR: {deposit.utr_number}'
            )

            return Response({
                'message': 'Deposit approved successfully',
                'new_balance': str(wallet.balance)
            })

        else:
            # Reject deposit
            deposit.status = 'rejected'
            deposit.rejected_at = timezone.now()
            deposit.rejected_by = request.user
            deposit.admin_note = admin_note
            deposit.save()

            # Update transaction record
            Transaction.objects.filter(
                user=deposit.user,
                amount=deposit.amount,
                status='pending'
            ).update(
                status='rejected',
                note=f'Deposit rejected: {admin_note}'
            )

            return Response({
                'message': 'Deposit rejected',
                'reason': admin_note
            })

    except DepositRequest.DoesNotExist:
        return Response({'error': 'Deposit request not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def referral_earnings(request):
    try:
        commissions = ReferralCommission.objects.filter(referrer=request.user)
        serializer = ReferralCommissionSerializer(commissions, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_referral_summary(request):
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        commissions = ReferralCommission.objects.all().order_by('-created_at')
        serializer = ReferralCommissionSerializer(commissions, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)



@api_view(['GET'])
def game_status(request):
    try:
        from .game_timing import GameTimingManager
        
        timing_manager = GameTimingManager()
        games_status = timing_manager.get_all_games_status()
        
        return Response({
            'games': games_status,
            'current_time': timing_manager.get_current_time().strftime('%I:%M %p'),
            'timezone': 'IST'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_stats(request):
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        users = User.objects.all()
        users_data = []

        for user in users:
            try:
                wallet = Wallet.objects.get(user=user)
            except Wallet.DoesNotExist:
                wallet = Wallet.objects.create(user=user)

            # Calculate total deposits
            total_deposits = DepositRequest.objects.filter(
                user=user, status='approved'
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

            # Calculate total withdrawals
            total_withdrawals = WithdrawRequest.objects.filter(
                user=user, is_approved=True
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

            # Calculate today's deposits
            today = timezone.now().date()
            today_deposits = DepositRequest.objects.filter(
                user=user, status='approved',
                created_at__date=today
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

            # Calculate today's withdrawals
            today_withdrawals = WithdrawRequest.objects.filter(
                user=user, is_approved=True,
                created_at__date=today
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

            # Calculate total referrals - count unique referred users
            total_referrals = ReferralCommission.objects.filter(
                referrer=user
            ).values('referred_user').distinct().count()

            # Calculate referral earnings
            referral_earnings = ReferralCommission.objects.filter(
                referrer=user
            ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')

            # Calculate total earnings (winnings + referral earnings)
            total_earnings = wallet.winnings + referral_earnings

            users_data.append({
                'id': user.id,
                'username': user.username,
                'mobile': user.mobile,
                'email': user.email or 'N/A',
                'balance': str(wallet.balance),
                'bonus': str(wallet.bonus),
                'winnings': str(wallet.winnings),
                'total_deposit': str(total_deposits),
                'total_withdraw': str(total_withdrawals),
                'total_earning': str(total_earnings),
                'today_deposit': str(today_deposits),
                'today_withdraw': str(today_withdrawals),
                'total_referrals': total_referrals,
                'referral_earnings': str(referral_earnings),
                'status': 'active' if user.is_active else 'blocked',
                'date_joined': user.date_joined
            })

        return Response(users_data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)



# ...existing code...

@api_view(['POST'])
@permission_classes([IsAdminUser])
def undo_result(request):
    """
    Undo result for a specific game and session.
    This will:
    - Set all bets in the session back to pending
    - Remove winnings from users
    - Remove referral commission for those bets (and minus from referrer wallet)
    """
    try:
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)
        
        game_name = request.data.get('game_name')
        if not game_name:
            return Response({'error': 'Game name required'}, status=400)

        game_name = game_name.strip().lower()

        # Get current session time window
        open_dt, close_dt, _ = get_game_time_window(game_name)
        if not open_dt or not close_dt:
            return Response({'error': 'Invalid game name or timings not set'}, status=400)

        # Filter only current session bets for this game
        bets = Bet.objects.filter(
            game_name__iexact=game_name, 
            status__in=['won', 'lost'],
            created_at__gte=open_dt,
            created_at__lte=close_dt
        )
        print(f"[UNDO] Found {bets.count()} bets to undo for {game_name} (session: {open_dt} to {close_dt})")

        for bet in bets:
            # Remove commission from referrer wallet and delete commission record for this bet
            commissions = ReferralCommission.objects.filter(bet=bet)
            for comm in commissions:
                referrer_wallet = Wallet.objects.get(user=comm.referrer)
                referrer_wallet.bonus -= comm.commission
                referrer_wallet.save()
            commissions.delete()

            # Remove winnings if any
            wallet = Wallet.objects.get(user=bet.user)
            if bet.payout and wallet.winnings >= bet.payout:
                wallet.winnings -= bet.payout
            elif bet.payout:
                wallet.winnings = Decimal('0.00')
            wallet.save()

            bet.status = 'pending'
            bet.is_win = False
            bet.payout = Decimal('0.00')
            bet.save()

        return Response({'message': f'Current session results and commissions for {game_name} have been securely undone'})
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=500)

# ...existing code...



@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveUser])
def my_referrals(request):
    user = request.user

    # Ensure referral_code is always set
    if not user.referral_code:
        import random, string
        code = user.username[:3].upper() + ''.join(random.choices(string.digits, k=4))
        user.referral_code = code
        user.save()

    # Count unique referred users (signup_bonus)
    total_referrals = ReferralCommission.objects.filter(
        referrer=user, commission_type='signup_bonus'
    ).values('referred_user').distinct().count()
    # Sum direct bonus
    direct_bonus = ReferralCommission.objects.filter(
        referrer=user, commission_type='signup_bonus'
    ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
    # Sum commission earned
    commission_earned = ReferralCommission.objects.filter(
        referrer=user, commission_type='bet_commission'
    ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
    # Total earned
    total_earned = direct_bonus + commission_earned

    return Response({
        "referral_code": user.referral_code,
        "total_referrals": total_referrals,
        "direct_bonus": float(direct_bonus),
        "commission_earned": float(commission_earned),
        "total_earned": float(total_earned)
    })



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum, Count
from decimal import Decimal
from django.utils import timezone
from .models import User, DepositRequest, WithdrawRequest, Bet, ReferralCommission

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Sum, Count
from decimal import Decimal
from django.utils import timezone, dateformat
from .models import User, DepositRequest, WithdrawRequest, Bet, ReferralCommission

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """
    Returns all analytics/statistics for the admin dashboard, including chart data.
    """
    # Total Revenue (all bets)
    total_revenue = Bet.objects.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    # Total Winnings Paid
    total_winnings = Bet.objects.filter(is_win=True).aggregate(total=Sum('payout'))['total'] or Decimal('0.00')
    # Total Referral Commission
    total_commission = ReferralCommission.objects.filter(commission_type='bet_commission').aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
    # Net Revenue
    net_revenue = total_revenue - (total_winnings + total_commission)

    # Total Users
    total_users = User.objects.count()
    # Pending Deposits/Withdrawals
    pending_deposits = DepositRequest.objects.filter(status='pending').count()
    pending_withdrawals = WithdrawRequest.objects.filter(is_approved=False, is_rejected=False).count()

    # Today's stats
    today = timezone.now().date()
    today_bets = Bet.objects.filter(created_at__date=today)
    today_total_bets = today_bets.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    today_total_payouts = today_bets.filter(is_win=True).aggregate(total=Sum('payout'))['total'] or Decimal('0.00')
    today_total_commission = ReferralCommission.objects.filter(
        commission_type='bet_commission', created_at__date=today
    ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
    today_earnings = today_total_bets - (today_total_payouts + today_total_commission)
    today_deposits = DepositRequest.objects.filter(status='approved', created_at__date=today).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    today_withdrawals = WithdrawRequest.objects.filter(is_approved=True, created_at__date=today).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    # Total Deposits/Withdrawals
    total_deposits = DepositRequest.objects.filter(status='approved').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    total_withdrawals = WithdrawRequest.objects.filter(is_approved=True).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    # New Users Today
    new_users_today = User.objects.filter(date_joined__date=today).count()
    # deposit_balance_left = total_deposit - total_bet
    available_deposit_balance = Wallet.objects.aggregate(total=Sum('balance'))['total'] or 0

    users = User.objects.all()
    total_wallet_balance = Decimal('0.00')

    for user in users:
        wallet = Wallet.objects.filter(user=user).first()
        if not wallet:
            continue

        # 1% commission (bet_commission)
        commission_earned = ReferralCommission.objects.filter(
            referrer=user, commission_type='bet_commission'
        ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
        # Direct bonus (signup_bonus)
        direct_bonus = ReferralCommission.objects.filter(
            referrer=user, commission_type='signup_bonus'
        ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')

        # User total balance
        user_total = (
            Decimal(wallet.balance)
            + Decimal(wallet.bonus)
           
            + Decimal(wallet.winnings)
            + Decimal(commission_earned)
            
        )
        total_wallet_balance += user_total


    # Recent Transactions (last 3, sorted by created_at)
    recent_deposits = DepositRequest.objects.filter(status='approved').order_by('-created_at')[:3]
    recent_withdrawals = WithdrawRequest.objects.filter(is_approved=True).order_by('-created_at')[:3]
    recent_transactions = []
    for dep in recent_deposits:
        recent_transactions.append({
            "user": dep.user.username,
            "amount": f"₹{dep.amount}",
            "type": "Deposit",
            "time": dep.created_at.strftime("%d-%m-%Y %I:%M %p"),
        })
    for wd in recent_withdrawals:
        recent_transactions.append({
            "user": wd.user.username,
            "amount": f"₹{wd.amount}",
            "type": "Withdrawal",
            "time": wd.created_at.strftime("%d-%m-%Y %I:%M %p"),
        })
    # Sort by time descending (latest first)
    recent_transactions = sorted(recent_transactions, key=lambda x: x["time"], reverse=True)[:3]

    # Recent Winners (last 3 winning bets)
    winners = Bet.objects.filter(is_win=True).order_by('-created_at')[:3]
    recent_winners = []
    for win in winners:
        recent_winners.append({
            "user": win.user.username,
            "game": win.game_name,
            "amount": f"₹{win.payout}",
            "time": win.created_at.strftime("%d-%m-%Y %I:%M %p"),
        })

    # ----------- CHART LOGIC -----------
    # Earnings Chart (Last 7 Days)
    from datetime import timedelta
    earnings_chart_labels = []
    earnings_chart_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        label = day.strftime("%a")  # Mon, Tue, etc.
        earnings_chart_labels.append(label)
        bets = Bet.objects.filter(created_at__date=day)
        total_bets = bets.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_payouts = bets.filter(is_win=True).aggregate(total=Sum('payout'))['total'] or Decimal('0.00')
        total_commission = ReferralCommission.objects.filter(
            commission_type='bet_commission', created_at__date=day
        ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
        earning = total_bets - (total_payouts + total_commission)
        earnings_chart_data.append(float(earning))

    # Earnings Chart (Last 4 Weeks)
    earnings_chart_month_labels = []
    earnings_chart_month_data = []
    for w in range(4, 0, -1):
        week_start = today - timedelta(days=7*w)
        week_end = week_start + timedelta(days=6)
        label = f"Week {5-w}"
        earnings_chart_month_labels.append(label)
        bets = Bet.objects.filter(created_at__date__gte=week_start, created_at__date__lte=week_end)
        total_bets = bets.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_payouts = bets.filter(is_win=True).aggregate(total=Sum('payout'))['total'] or Decimal('0.00')
        total_commission = ReferralCommission.objects.filter(
            commission_type='bet_commission',
            created_at__date__gte=week_start,
            created_at__date__lte=week_end
        ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
        earning = total_bets - (total_payouts + total_commission)
        earnings_chart_month_data.append(float(earning))

    # User Activity Chart (Last 3 Months)
    from django.utils.timezone import now
    user_activity_labels = []
    user_activity_active = []
    user_activity_new = []
    for m in range(2, -1, -1):
        month = (now() - timedelta(days=30*m)).date().replace(day=1)
        label = month.strftime("%B")
        user_activity_labels.append(label)
        # Active users: users who placed at least 1 bet in this month
        month_end = (month.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
        active_users = User.objects.filter(
            bet__created_at__date__gte=month,
            bet__created_at__date__lte=month_end
        ).distinct().count()
        new_users = User.objects.filter(date_joined__date__gte=month, date_joined__date__lte=month_end).count()
        user_activity_active.append(active_users)
        user_activity_new.append(new_users)

    return Response({
        "total_revenue": str(total_revenue),
        "net_revenue": str(net_revenue),
        "total_users": total_users,
        "pending_deposits": pending_deposits,
        "pending_withdrawals": pending_withdrawals,
        "today_earnings": str(today_earnings),
        "today_deposits": str(today_deposits),
        "today_withdrawals": str(today_withdrawals),
        "total_deposits": str(total_deposits),
        "total_withdrawals": str(total_withdrawals),
        "new_users_today": new_users_today,
        'available_deposit_balance': str(available_deposit_balance),
        "total_wallet_balance": str(total_wallet_balance),
        "recent_transactions": recent_transactions,
        "recent_winners": recent_winners,
        "earnings_chart": {
            "labels": earnings_chart_labels,
            "data": earnings_chart_data,
        },
        "earnings_chart_month": {
            "labels": earnings_chart_month_labels,
            "data": earnings_chart_month_data,
        },
        "user_activity_chart": {
            "labels": user_activity_labels,
            "active": user_activity_active,
            "new": user_activity_new,
        },
    })

from .serializers import DepositRequestSerializer, WithdrawRequestSerializer, BetSerializer

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_details(request, user_id):
    """
    Returns all details for a user including wallet stats, commission, bonus, etc.
    """
    user = get_object_or_404(User, id=user_id)
    wallet = Wallet.objects.get(user=user)
    # 1% commission (bet_commission)
    commission_earned = ReferralCommission.objects.filter(
        referrer=user, commission_type='bet_commission'
    ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
    # Direct bonus (signup_bonus)
    direct_bonus = ReferralCommission.objects.filter(
        referrer=user, commission_type='signup_bonus'
    ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
    # Total referral earnings (all types)
    referral_earnings = ReferralCommission.objects.filter(
        referrer=user
    ).aggregate(total=Sum('commission'))['total'] or Decimal('0.00')
    # Total earning = winnings + all referral earnings
    total_earning = wallet.winnings + referral_earnings
    total_winning = wallet.winnings
    total_wallet = wallet.balance + wallet.bonus + wallet.winnings


    return Response({
        "id": user.id,
        "username": user.username,
        "mobile": user.mobile,
        "email": user.email,
        "status": "active" if user.is_active else "blocked",
        "referral_code": user.referral_code,
        "date_joined": user.date_joined,
        "commission_earned": float(commission_earned),   # 1% commission
        "direct_bonus": float(direct_bonus),             # Signup bonus
        "referral_earnings": float(referral_earnings),   # All referral earnings
        "total_earning": float(total_earning),           # winnings + all referral earnings
        "total_winning": float(total_winning),           # Only bet winnings
        "total_wallet": float(total_wallet),
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_deposits(request, user_id):
    """
    Returns all deposit requests for a user (for admin panel).
    """
    deposits = DepositRequest.objects.filter(user_id=user_id).order_by('-created_at')
    # For frontend, map utr_number to 'utr' key for consistency
    data = []
    for dep in deposits:
        data.append({
            "id": dep.id,
            "amount": float(dep.amount),
            "status": dep.status,
            "utr": dep.utr_number,
            "created_at": dep.created_at,
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_withdrawals(request, user_id):
    """
    Returns all withdrawal requests for a user (for admin panel).
    """
    withdrawals = WithdrawRequest.objects.filter(user_id=user_id).order_by('-created_at')
    data = []
    for w in withdrawals:
        data.append({
            "id": w.id,
            "amount": float(w.amount),
            "status": (
                "approved" if w.is_approved else
                "rejected" if w.is_rejected else
                "pending"
            ),
            "utr": getattr(w, "utr_number", ""),  # If field exists
            "created_at": w.created_at,
        })
    return Response(data)



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from .models import User, Bet, DepositRequest, WithdrawRequest, ReferralCommission, Wallet

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_block_user(request, user_id):
    """
    Block or unblock a user.
    POST data: { "status": "blocked" or "active" }
    """
    user = get_object_or_404(User, id=user_id)
    status_val = request.data.get("status")
    if status_val not in ["active", "blocked"]:
        return Response({"error": "Invalid status"}, status=400)
    user.is_active = status_val == "active"
    user.save()
    return Response({"success": True, "status": status_val})


from decimal import Decimal
from datetime import datetime, date

def convert_for_json(obj):
    if isinstance(obj, list):
        return [convert_for_json(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return str(obj)
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reset_user(request, user_id):
    """
    Securely reset all user data: bets, deposits, withdrawals, commissions, wallet, transactions, referral records.
    Backup is taken BEFORE deletion for undo.
    """
    from .models import UserDataBackup
    from decimal import Decimal

    user = get_object_or_404(User, id=user_id)

    # Take backup BEFORE deleting anything
    backup_data = {
        "bets": list(Bet.objects.filter(user=user).values()),
        "deposits": list(DepositRequest.objects.filter(user=user).values()),
        "withdrawals": list(WithdrawRequest.objects.filter(user=user).values()),
        "ref_comm_referrer": list(ReferralCommission.objects.filter(referrer=user).values()),
        "ref_comm_referred": list(ReferralCommission.objects.filter(referred_user=user).values()),
        "transactions": list(Transaction.objects.filter(user=user).values()),
        "wallet": Wallet.objects.filter(user=user).values().first(),
    }
    backup_data = convert_for_json(backup_data)  # <-- Use new function here
    UserDataBackup.objects.create(user=user, data=backup_data)

    # Now delete all user-related data
    Bet.objects.filter(user=user).delete()
    DepositRequest.objects.filter(user=user).delete()
    WithdrawRequest.objects.filter(user=user).delete()
    ReferralCommission.objects.filter(referrer=user).delete()
    ReferralCommission.objects.filter(referred_user=user).delete()
    Transaction.objects.filter(user=user).delete()

    # Reset wallet
    try:
        wallet = Wallet.objects.get(user=user)
        wallet.balance = Decimal('0.00')
        wallet.winnings = Decimal('0.00')
        wallet.bonus = Decimal('0.00')
        wallet.save()
    except Wallet.DoesNotExist:
        pass

    # Optionally reset user bonus fields if present
    if hasattr(user, "direct_bonus"):
        user.direct_bonus = 0
    if hasattr(user, "commission_earned"):
        user.commission_earned = 0
    user.save()

    return Response({"success": True, "msg": "User data reset"})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_bets(request, user_id):
    """
    Returns all bets for a user for the last N months (default 2).
    """
    from datetime import timedelta
    from django.utils import timezone
    months = int(request.GET.get("months", 2))
    since = timezone.now() - timedelta(days=30*months)
    bets = Bet.objects.filter(user_id=user_id, created_at__gte=since).order_by('-created_at')
    data = []
    for bet in bets:
        data.append({
            "id": bet.id,
            "game_name": bet.game_name,
            "bet_type": bet.bet_type,        
            "number": bet.number, 
            "amount": float(bet.amount),
            "status": bet.status if hasattr(bet, 'status') else ('won' if bet.is_win else 'lost'),
            "winning_number": getattr(bet, "winning_number", ""),
            "win_amount": float(getattr(bet, "payout", 0)),
            "created_at": bet.created_at,
        })
    return Response(data)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import Game, Bet
from django.db.models import Sum, Count
from datetime import datetime


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reset_game_stats(request, game_id):
    """
    Reset all stats for a game (delete all bets for this game).
    """
    try:
        game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        return Response({"error": "Game not found"}, status=404)
    Bet.objects.filter(game=game).delete()
    return Response({"success": True, "msg": "Game stats reset"})



@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveUser])
def edit_user_profile(request):
    """
    User can update only their name (username) and email.
    """
    user = request.user
    data = request.data

    username = data.get('username')
    email = data.get('email')

    updated = False

    if username:
        user.username = username
        updated = True
    if email:
        user.email = email
        updated = True

    if updated:
        user.save()
        return Response({
            "success": True,
            "username": user.username,
            "email": user.email
        })
    else:
        return Response({"error": "No data to update."}, status=400)

from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_undo_reset_user(request, user_id):
    """
    Securely restore all user data from backup, handling foreign keys and integrity.
    """
    from .models import UserDataBackup, Wallet, Bet, DepositRequest, WithdrawRequest, ReferralCommission, Transaction, User

    user = get_object_or_404(User, id=user_id)
    backup = UserDataBackup.objects.filter(user=user).order_by('-created_at').first()
    if not backup:
        return Response({"success": False, "msg": "No backup found for this user."})

    data = backup.data

    try:
        with transaction.atomic():
            # Restore wallet
            Wallet.objects.filter(user=user).delete()
            wallet_data = data.get("wallet")
            if wallet_data:
                wallet_data.pop('id', None)
                wallet_data['user_id'] = user.id
                Wallet.objects.create(**wallet_data)

            # Restore deposits and keep old_id -> new_id mapping
            DepositRequest.objects.filter(user=user).delete()
            deposit_id_map = {}
            for dep in data.get("deposits", []):
                old_id = dep.pop('id', None)
                dep['user_id'] = user.id
                obj = DepositRequest.objects.create(**dep)
                if old_id is not None:
                    deposit_id_map[old_id] = obj.id

            # Restore withdrawals and keep old_id -> new_id mapping
            WithdrawRequest.objects.filter(user=user).delete()
            withdraw_id_map = {}
            for wd in data.get("withdrawals", []):
                old_id = wd.pop('id', None)
                wd['user_id'] = user.id
                obj = WithdrawRequest.objects.create(**wd)
                if old_id is not None:
                    withdraw_id_map[old_id] = obj.id

            # Restore bets
            Bet.objects.filter(user=user).delete()
            for bet in data.get("bets", []):
                bet.pop('id', None)
                bet['user_id'] = user.id
                Bet.objects.create(**bet)

            # Restore referral commissions
            ReferralCommission.objects.filter(referrer=user).delete()
            ReferralCommission.objects.filter(referred_user=user).delete()
            for rc in data.get("ref_comm_referrer", []):
                rc.pop('id', None)
                rc['referrer_id'] = user.id
                ReferralCommission.objects.create(**rc)
            for rc in data.get("ref_comm_referred", []):
                rc.pop('id', None)
                rc['referred_user_id'] = user.id
                ReferralCommission.objects.create(**rc)

            # Restore transactions (fix related_deposit_id/related_withdrawal_id)
            Transaction.objects.filter(user=user).delete()
            for txn in data.get("transactions", []):
                txn.pop('id', None)
                txn['user_id'] = user.id
                # Fix related_deposit_id
                if txn.get('related_deposit_id'):
                    old_dep_id = txn['related_deposit_id']
                    txn['related_deposit_id'] = deposit_id_map.get(old_dep_id)
                if txn.get('related_withdrawal_id'):
                    old_wd_id = txn['related_withdrawal_id']
                    txn['related_withdrawal_id'] = withdraw_id_map.get(old_wd_id)
                Transaction.objects.create(**txn)

            # Restore user bonus/commission fields if present in backup
            wallet_backup = data.get("wallet", {})
            if "direct_bonus" in wallet_backup:
                user.direct_bonus = wallet_backup["direct_bonus"]
            if "commission_earned" in wallet_backup:
                user.commission_earned = wallet_backup["commission_earned"]
            user.save()

        return Response({"success": True, "msg": "User data securely restored from backup."})
    except Exception as e:
        return Response({"success": False, "msg": f"Restore failed: {str(e)}"}, status=500)
   
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_backup(request, user_id):
    """
    Return the latest backup data for a user (for admin to view after reset).
    """
    from .models import UserDataBackup, User
    user = get_object_or_404(User, id=user_id)
    backup = UserDataBackup.objects.filter(user=user).order_by('-created_at').first()
    if not backup:
        return Response({"success": False, "msg": "No backup found for this user."}, status=404)
    return Response({"success": True, "backup": backup.data})



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import User, Wallet, WalletAuditLog

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_update_wallet(request, user_id):
    """
    Admin can update user's wallet (balance, bonus, winnings) with reason.
    """
    user = get_object_or_404(User, id=user_id)
    wallet = get_object_or_404(Wallet, user=user)
    data = request.data

    try:
        balance = Decimal(data.get("balance", wallet.balance))
        bonus = Decimal(data.get("bonus", wallet.bonus))
        winnings = Decimal(data.get("winnings", wallet.winnings))
        reason = data.get("reason", "").strip()
        if not reason:
            return Response({"error": "Reason is required."}, status=400)
        if balance < 0 or bonus < 0 or winnings < 0:
            return Response({"error": "Negative values not allowed."}, status=400)
    except Exception:
        return Response({"error": "Invalid input."}, status=400)

    # Log the change
    WalletAuditLog.objects.create(
        user=user,
        admin=request.user,
        old_balance=wallet.balance,
        new_balance=balance,
        old_bonus=wallet.bonus,
        new_bonus=bonus,
        old_winnings=wallet.winnings,
        new_winnings=winnings,
        reason=reason,
    )

    # Update wallet
    wallet.balance = balance
    wallet.bonus = bonus
    wallet.winnings = winnings
    wallet.save()

    return Response({"success": True, "msg": "Wallet updated successfully."})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_games_stats(request):
    games = Game.objects.all()
    today = datetime.now().date()
    month_start = today.replace(day=1)
    data = []
    for game in games:
        total_bets = Bet.objects.filter(game_name=game.name).count()
        total_amount = Bet.objects.filter(game_name=game.name).aggregate(total=Sum('amount'))['total'] or 0
        total_win_paid = Bet.objects.filter(game_name=game.name, is_win=True).aggregate(total=Sum('payout'))['total'] or 0
        total_commission = ReferralCommission.objects.filter(
            bet__game_name=game.name,
            commission_type='bet_commission'
        ).aggregate(total=Sum('commission'))['total'] or 0
        total_earnings = total_amount - total_win_paid - total_commission

        month_bets = Bet.objects.filter(game_name=game.name, created_at__date__gte=month_start)
        monthly_amount = month_bets.aggregate(total=Sum('amount'))['total'] or 0
        monthly_win_paid = month_bets.filter(is_win=True).aggregate(total=Sum('payout'))['total'] or 0
        monthly_commission = ReferralCommission.objects.filter(
            bet__game_name=game.name,
            commission_type='bet_commission',
            created_at__date__gte=month_start
        ).aggregate(total=Sum('commission'))['total'] or 0
        monthly_earnings = monthly_amount - monthly_win_paid - monthly_commission
        monthly_bets = month_bets.count()
        monthly_bets_amount = monthly_amount

        data.append({
            "id": game.id,
            "name": game.name,
            "openTime": game.open_time.strftime("%I:%M %p") if game.open_time else "",
            "closeTime": game.close_time.strftime("%I:%M %p") if game.close_time else "",
            "status": "Active" if game.is_active else "Inactive",
            "totalBets": total_bets,
            "totalAmount": total_amount,
            "totalEarnings": total_earnings,
            "monthlyEarnings": monthly_earnings,
            "monthlyBets": monthly_bets,
            "monthlyBetsAmount": monthly_bets_amount,
            "commissionApplicable": game.name.lower() in ['faridabad', 'gali', 'disawer', 'ghaziabad'],
        })
    return Response(data)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import User, Wallet

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_edit_user(request, user_id):
    """
    Admin can edit user's mobile, email, winnings, and balance.
    POST data: { "mobile": "...", "email": "...", "total_winning": ..., "total_wallet": ... }
    """
    user = get_object_or_404(User, id=user_id)
    wallet = get_object_or_404(Wallet, user=user)

    mobile = request.data.get("mobile")
    email = request.data.get("email")
    total_winning = request.data.get("total_winning")
    total_wallet = request.data.get("total_wallet")

    if mobile is not None:
        user.mobile = mobile
    if email is not None:
        user.email = email
    user.save()

    # Update wallet fields
    try:
        if total_winning is not None:
            wallet.winnings = Decimal(str(total_winning))
        if total_wallet is not None:
            # If you want to set only the main balance (not bonus/winnings), do:
            wallet.balance = Decimal(str(total_wallet))
        wallet.save()
    except Exception as e:
        return Response({"success": False, "msg": f"Wallet update failed: {str(e)}"}, status=400)

    return Response({"success": True, "msg": "User updated"})