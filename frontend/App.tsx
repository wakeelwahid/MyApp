import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import components
import Header from "./components/Header";
import HomeScreen from "./components/HomeScreen";
import Games from "./components/Games";
import BottomMenu from "./components/BottomMenu";
import BettingModal from "./components/BettingModal";
import BetSuccessModal from "./components/BetSuccessModal";
import MyBet from "./components/MyBet";
import WalletOperations from "./components/WalletOperations";
import PaymentSuccess from "./components/PaymentSuccess";
import WithdrawSuccess from "./components/WithdrawSuccess";
import Profile from "./components/Profile";
import AgeVerificationModal from "./components/AgeVerificationModal";
import Transaction from "./components/Transaction";
import KYCPage from "./components/KYCPage";
import ReferPage from "./components/ReferPage";
import { GameHistory, ResultsModal } from "./components";

// Import constants
import { GAME_CARDS } from "./constants/gameData";

// Import hooks
import { useAuth } from "./hooks/useAuth";
import { useWallet } from "./hooks/useWallet";
import AuthScreen from "./components/AuthScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;

interface BetItem {
  id: number;
  number: string | number;
  amount: number;
  type: string;
  game: string;
  timestamp: number | Date;
  status?: string;
  sessionTime?: string;
  date?: string;
}

interface GameItem {
  title: string;
  timing?: string;
}

export default function App() {
  // Auth state
  const { user, isAuthenticated, logout } = useAuth();

  // Use proper authentication state from useAuth hook
  const [showAuthRequired, setShowAuthRequired] = useState(false);

  // Wallet state
  const { wallet, withdrawMoney } = useWallet();

  // Sync authentication states
  useEffect(() => {
    if (isAuthenticated && user) {
      setShowAuthRequired(false);
      console.log("✅ User authenticated:", {
        name: user.username || user.name,
        phone: user.mobile || user.phone,
        id: user.id
      });
    } else {
      console.log("❌ User not authenticated");
    }
  }, [isAuthenticated, user]);

  const [showBettingModalState, setShowBettingModalState] = useState(false);
  const [selectedGameState, setSelectedGameState] = useState<GameItem | null>(null);
  const [showAmountModalState, setShowAmountModalState] = useState(false);
  const [selectedNumberState] = useState<string>('');
  const [customAmountState, setCustomAmountState] = useState("");
  const [betListState, setBetListState] = useState<BetItem[]>([]);
  const [betHistoryState, setBetHistoryState] = useState<BetItem[]>([
    {
      id: 1,
      game: "Jaipur King",
      number: "14",
      amount: 100,
      type: "single",
      status: "pending",
      timestamp: Date.now() - 3600000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 2,
      game: "Jaipur King",
      number: "2",
      amount: 100,
      type: "andar",
      status: "pending",
      timestamp: Date.now() - 3600000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 3,
      game: "Jaipur King",
      number: "61",
      amount: 100,
      type: "single",
      status: "pending",
      timestamp: Date.now() - 3600000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 4,
      game: "Jaipur King",
      number: "5",
      amount: 50,
      type: "bahar",
      status: "pending",
      timestamp: Date.now() - 3600000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 5,
      game: "Jaipur King",
      number: "77",
      amount: 200,
      type: "jodi",
      status: "pending",
      timestamp: Date.now() - 3600000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 6,
      game: "Jaipur King",
      number: "9",
      amount: 150,
      type: "single",
      status: "pending",
      timestamp: Date.now() - 3600000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 7,
      game: "Faridabad",
      number: "6",
      amount: 100,
      type: "single",
      status: "win",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 8,
      game: "Faridabad",
      number: "8",
      amount: 100,
      type: "single",
      status: "win",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 9,
      game: "Faridabad",
      number: "1",
      amount: 100,
      type: "andar",
      status: "win",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 10,
      game: "Faridabad",
      number: "27",
      amount: 100,
      type: "single",
      status: "loss",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 11,
      game: "Faridabad",
      number: "33",
      amount: 100,
      type: "single",
      status: "loss",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 12,
      game: "Faridabad",
      number: "4",
      amount: 100,
      type: "bahar",
      status: "loss",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 13,
      game: "Faridabad",
      number: "19",
      amount: 500,
      type: "single",
      status: "loss",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 14,
      game: "Faridabad",
      number: "99",
      amount: 300,
      type: "jodi",
      status: "loss",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 15,
      game: "Faridabad",
      number: "0",
      amount: 100,
      type: "andar",
      status: "win",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 16,
      game: "Faridabad",
      number: "7",
      amount: 250,
      type: "single",
      status: "win",
      timestamp: Date.now() - 7200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 17,
      game: "Ghaziabad",
      number: "89",
      amount: 200,
      type: "jodi",
      status: "loss",
      timestamp: Date.now() - 86400000,
      sessionTime: "11:00 PM - 07:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 18,
      game: "Ghaziabad",
      number: "45",
      amount: 150,
      type: "single",
      status: "win",
      timestamp: Date.now() - 86400000,
      sessionTime: "11:00 PM - 07:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 19,
      game: "Ghaziabad",
      number: "3",
      amount: 100,
      type: "single",
      status: "win",
      timestamp: Date.now() - 86400000,
      sessionTime: "11:00 PM - 07:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 20,
      game: "Ghaziabad",
      number: "7",
      amount: 50,
      type: "bahar",
      status: "loss",
      timestamp: Date.now() - 86400000,
      sessionTime: "11:00 PM - 07:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 21,
      game: "Ghaziabad",
      number: "56",
      amount: 300,
      type: "jodi",
      status: "loss",
      timestamp: Date.now() - 86400000,
      sessionTime: "11:00 PM - 07:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 22,
      game: "Ghaziabad",
      number: "2",
      amount: 100,
      type: "andar",
      status: "win",
      timestamp: Date.now() - 86400000,
      sessionTime: "11:00 PM - 07:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 23,
      game: "Gali",
      number: "12",
      amount: 300,
      type: "single",
      status: "pending",
      timestamp: Date.now() - 1800000,
      sessionTime: "04:00 AM - 10:30 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 24,
      game: "Gali",
      number: "3",
      amount: 200,
      type: "bahar",
      status: "pending",
      timestamp: Date.now() - 1800000,
      sessionTime: "04:00 AM - 10:30 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 25,
      game: "Gali",
      number: "88",
      amount: 150,
      type: "jodi",
      status: "pending",
      timestamp: Date.now() - 1800000,
      sessionTime: "04:00 AM - 10:30 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 26,
      game: "Gali",
      number: "5",
      amount: 100,
      type: "single",
      status: "pending",
      timestamp: Date.now() - 1800000,
      sessionTime: "04:00 AM - 10:30 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 27,
      game: "Gali",
      number: "9",
      amount: 100,
      type: "andar",
      status: "pending",
      timestamp: Date.now() - 1800000,
      sessionTime: "04:00 AM - 10:30 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 28,
      game: "Disawer",
      number: "23",
      amount: 100,
      type: "single",
      status: "win",
      timestamp: Date.now() - 10800000,
      sessionTime: "07:00 AM - 02:30 AM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 29,
      game: "Disawer",
      number: "67",
      amount: 200,
      type: "jodi",
      status: "loss",
      timestamp: Date.now() - 10800000,
      sessionTime: "07:00 AM - 02:30 AM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 30,
      game: "Disawer",
      number: "4",
      amount: 50,
      type: "bahar",
      status: "win",
      timestamp: Date.now() - 10800000,
      sessionTime: "07:00 AM - 02:30 AM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 31,
      game: "Disawer",
      number: "1",
      amount: 150,
      type: "single",
      status: "loss",
      timestamp: Date.now() - 10800000,
      sessionTime: "07:00 AM - 02:30 AM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 32,
      game: "Disawer",
      number: "8",
      amount: 100,
      type: "andar",
      status: "win",
      timestamp: Date.now() - 10800000,
      sessionTime: "07:00 AM - 02:30 AM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 33,
      game: "Diamond King",
      number: "55",
      amount: 500,
      type: "jodi",
      status: "win",
      timestamp: Date.now() - 14400000,
      sessionTime: "06:00 AM - 10:10 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 34,
      game: "Diamond King",
      number: "6",
      amount: 200,
      type: "single",
      status: "loss",
      timestamp: Date.now() - 14400000,
      sessionTime: "06:00 AM - 10:10 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 35,
      game: "Diamond King",
      number: "11",
      amount: 100,
      type: "jodi",
      status: "loss",
      timestamp: Date.now() - 14400000,
      sessionTime: "06:00 AM - 10:10 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 36,
      game: "Diamond King",
      number: "3",
      amount: 50,
      type: "bahar",
      status: "win",
      timestamp: Date.now() - 14400000,
      sessionTime: "06:00 AM - 10:10 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 37,
      game: "Diamond King",
      number: "9",
      amount: 100,
      type: "single",
      status: "win",
      timestamp: Date.now() - 14400000,
      sessionTime: "06:00 AM - 10:10 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 38,
      game: "Diamond King",
      number: "0",
      amount: 75,
      type: "andar",
      status: "loss",
      timestamp: Date.now() - 14400000,
      sessionTime: "06:00 AM - 10:10 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 39,
      game: "Jaipur King",
      number: "44",
      amount: 400,
      type: "jodi",
      status: "win",
      timestamp: Date.now() - 172800000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 40,
      game: "Jaipur King",
      number: "7",
      amount: 250,
      type: "single",
      status: "loss",
      timestamp: Date.now() - 172800000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 41,
      game: "Jaipur King",
      number: "6",
      amount: 100,
      type: "bahar",
      status: "win",
      timestamp: Date.now() - 172800000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 42,
      game: "Jaipur King",
      number: "22",
      amount: 300,
      type: "jodi",
      status: "loss",
      timestamp: Date.now() - 172800000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 43,
      game: "Faridabad",
      number: "13",
      amount: 1000,
      type: "single",
      status: "win",
      timestamp: Date.now() - 259200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 44,
      game: "Faridabad",
      number: "78",
      amount: 600,
      type: "jodi",
      status: "loss",
      timestamp: Date.now() - 259200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 45,
      game: "Faridabad",
      number: "5",
      amount: 200,
      type: "andar",
      status: "win",
      timestamp: Date.now() - 259200000,
      sessionTime: "10:00 PM - 06:40 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 46,
      game: "Gali",
      number: "90",
      amount: 800,
      type: "jodi",
      status: "win",
      timestamp: Date.now() - 345600000,
      sessionTime: "04:00 AM - 10:30 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 47,
      game: "Disawer",
      number: "2",
      amount: 150,
      type: "single",
      status: "loss",
      timestamp: Date.now() - 432000000,
      sessionTime: "07:00 AM - 02:30 AM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 48,
      game: "Diamond King",
      number: "77",
      amount: 500,
      type: "jodi",
      status: "win",
      timestamp: Date.now() - 518400000,
      sessionTime: "06:00 AM - 10:10 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 49,
      game: "Ghaziabad",
      number: "4",
      amount: 100,
      type: "single",
      status: "loss",
      timestamp: Date.now() - 604800000,
      sessionTime: "11:00 PM - 07:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
    {
      id: 50,
      game: "Jaipur King",
      number: "9",
      amount: 200,
      type: "bahar",
      status: "win",
      timestamp: Date.now() - 691200000,
      sessionTime: "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    },
  ]);
  const [currentBetTypeState, setCurrentBetTypeState] = useState("numbers");
  const [showAuthModalState, setShowAuthModalState] = useState(false);
  const [showAddCashModalState, setShowAddCashModalState] = useState(false);
  const [showWithdrawModalState, setShowWithdrawModalState] = useState(false);
  const [depositAmountState, setDepositAmountState] = useState("");
  const [withdrawAmountState, setWithdrawAmountState] = useState("");
  const [showPaymentModalState, setShowPaymentModalState] = useState(false);
  const [selectedPaymentMethodState, setSelectedPaymentMethodState] =
    useState("");
  const [utrNumberState, setUtrNumberState] = useState("");
  const [showPaymentSuccessModalState, setShowPaymentSuccessModalState] =
    useState(false);
  const [showWithdrawSuccessModalState, setShowWithdrawSuccessModalState] =
    useState(false);
  const [userDataState, setUserDataState] = useState({
    name: "John Doe",
    phone: "+91 98765 43210",
    email: "john@example.com",
    referralCode: "REF12345",
    kycStatus: "VERIFIED" as "VERIFIED" | "PENDING" | "REJECTED",
  });

  const [showBetSuccessState, setShowBetSuccessState] = useState(false);
  const [lastBetDetailsState, setLastBetDetailsState] = useState<any>(null);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  const [placedBetsState, setPlacedBetsState] = React.useState<BetItem[]>([]);

  const [showAgeVerificationState, setShowAgeVerificationState] =
    React.useState(false);
  const [isAgeVerifiedState, setIsAgeVerifiedState] = React.useState(false);
  const [showKYCPageState, setShowKYCPageState] = React.useState(false);

  const gameCards = GAME_CARDS;
  // UI state - consolidated to avoid conflicts
  const [activeTabLocal, setActiveTabLocal] = useState("home");

  // Game state
  const [selectedGameLocal, setSelectedGameLocal] = useState<GameItem | null>(null);

  useEffect(() => {
    // Check age verification on app start
    setShowAgeVerificationState(true);
  }, []);

  const handlePlayNow = (game: any) => {
    if (!isAuthenticated || !user) {
      setShowAuthRequired(true);
      setShowAuthModalState(true);
      return;
    }
    setSelectedGameState(game);
    setShowBettingModalState(true);
  };

  const handleMenuItemPress = (key: string) => {
    // Allow access to these pages without authentication
    const publicPages = ["home", "refer", "terms", "privacy", "refund", "help"];

    if (!isAuthenticated && !publicPages.includes(key)) {
      setShowAuthRequired(true);
      setShowAuthModalState(true);
      return;
    }

    // User is authenticated, allow access to all components
    setActiveTabLocal(key);
  };

  const handleGameSelect = (game: GameItem) => {
    if (!isAuthenticated || !user) {
      setShowAuthRequired(true);
      setShowAuthModalState(true);
      return;
    }
    setSelectedGameLocal(game);
    setSelectedGameState(game); // Also set the state game
    setBetListState([]); // Clear any previous selections
    setShowBettingModalState(true);
  };

  const handleNumberSelect = (number: string | number, type: string, amount: number) => {
    // Add number to selected list with amount
    const existingBetIndex = betListState.findIndex(
      (b) => b.number === number && b.type === type,
    );

    if (existingBetIndex >= 0) {
      // Update existing bet amount
      const updatedBetList = [...betListState];
      updatedBetList[existingBetIndex].amount = amount;
      setBetListState(updatedBetList);
    } else {
      // Add new bet to list
      const newBet: BetItem = {
        id: Date.now(),
        number,
        amount,
        type,
        game: selectedGameState?.title || "",
        timestamp: new Date(),
      };
      setBetListState([...betListState, newBet]);
    }
  };

  const handlePlaceBets = () => {
    console.log("handlePlaceBets called with betList:", betListState);

    if (!isAuthenticated || !user) {
      Alert.alert(
        "Login Required",
        "Bet place करने के लिए आपको login करना होगा।",
      );
      setShowAuthRequired(true);
      setShowAuthModalState(true);
      return;
    }

    if (betListState.length === 0) {
      Alert.alert("No Bets", "कोई bet select नहीं किया गया है।");
      return;
    }

    const totalAmount = betListState.reduce(
      (total, bet) => total + bet.amount,
      0,
    );
    const currentWallet = parseFloat(wallet.replace("₹", "").replace(",", ""));

    console.log("Total amount:", totalAmount, "Current wallet:", currentWallet);

    // For demo purposes, allow bet placement even with insufficient balance
    // In production, you would validate wallet balance properly

    // Deduct money from wallet (only if sufficient balance)
    if (currentWallet >= totalAmount) {
      withdrawMoney(totalAmount);
    }

    // Create bet records with proper status and timestamp
    const newBets: BetItem[] = betListState.map((bet) => ({
      ...bet,
      id: Date.now() + Math.random(),
      game:
        selectedGameLocal?.title || selectedGameState?.title || "Unknown Game",
      status: "pending",
      timestamp: Date.now(),
      sessionTime:
        selectedGameLocal?.timing ||
        selectedGameState?.timing ||
        "09:00 PM - 04:50 PM",
      date: new Date().toISOString().split("T")[0],
    }));

    // Set success details for display
    const betDetails = {
      number:
        betListState.length > 1
          ? `${betListState.length} Numbers`
          : String(betListState[0].number),
      amount: totalAmount,
      type: betListState.length > 1 ? "Multiple" : betListState[0].type,
      gameName: selectedGameLocal?.title || selectedGameState?.title || "",
      betCount: betListState.length,
    };

    // Add to placed bets and bet history
    setPlacedBetsState((prevBets) => [...prevBets, ...newBets]);
    setBetHistoryState((prevHistory) => [...prevHistory, ...newBets]);
    setLastBetDetailsState(betDetails);

    // Clear current bet selection
    setBetListState([]);

    // Close betting modal and show success
    setShowBettingModalState(false);
    setShowBetSuccessState(true);

    console.log("Bet placed successfully, success modal should be visible");

    // Auto navigate to Home after 7 seconds
    const timer = setTimeout(() => {
      console.log("Auto navigating to home page");
      setShowBetSuccessState(false);
      setActiveTabLocal("home");
    }, 7000);

    setRedirectTimer(timer);
  };

  const handleBetPlace = (amount: number) => {
    const newBet: BetItem = {
      id: Date.now(),
      number: selectedNumberState,
      amount: amount,
      type: currentBetTypeState,
      game: selectedGameState?.title || "Unknown Game",
      timestamp: new Date(),
      status: "pending",
    };

    // Here you can make API call to place bet
    // const result = await apiService.placeBet({
    //   gameId: selectedGame.id,
    //   number: selectedNumber,
    //   amount,
    //   type: currentBetType
    // });

    setBetListState([...betListState, newBet]);
    setShowAmountModalState(false);
    Alert.alert(
      "Bet Placed!",
      `आपका ₹${amount} का bet ${selectedNumberState} पर लगा दिया गया है।`,
    );
  };

  const removeBet = (betId: number) => {
    setBetListState(betListState.filter((b) => b.id !== betId));
  };

  const handleAuthSuccess = (userData: any) => {
    console.log("🎯 Auth success handler called with:", userData);

    if (!userData || (!userData.phone && !userData.mobile)) {
      console.error("❌ Invalid user data received:", userData);
      Alert.alert("Error", "Invalid user data received");
      return;
    }

    // Close auth modals immediately
    setShowAuthRequired(false);
    setShowAuthModalState(false);

    // Force redirect to home page
    setActiveTabLocal("home");

    console.log("✅ Auth success completed:", {
      name: userData.username || userData.name,
      mobile: userData.mobile || userData.phone,
      redirectedToHome: true
    });

    // Show success message after state update
    setTimeout(() => {
      const userName = userData.username || userData.name;
      if (userData.isNewUser) {
        Alert.alert(
          "🎉 Welcome!",
          `${userName}, आपका account successfully create हो गया!\n\n🎁 Welcome bonus: ₹100\n📱 सभी features अब unlock हैं!`,
          [{ text: "शुरू करें", style: "default" }],
        );
      } else {
        Alert.alert(
          "✅ Login Successful",
          `Welcome back, ${userName}!\n\n🎮 अब आप सभी games और features access कर सकते हैं!`,
          [{ text: "Continue", style: "default" }],
        );
      }
    }, 300);
  };



  const handleWithdraw = async (amount: number) => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        "Login Required",
        "Money withdraw करने के लिए आपको login करना होगा।",
      );
      setShowAuthRequired(true);
      setShowAuthModalState(true);
      return;
    }
    // For demo purposes, allow withdrawal regardless of wallet balance
    // In production, you would validate wallet balance properly

    // Close withdraw modal first
    setShowWithdrawModalState(false);

    // Show withdrawal success modal
    setShowWithdrawSuccessModalState(true);

    // Optional: Deduct from wallet if sufficient balance
    const currentWallet = parseFloat(wallet.replace("₹", "").replace(",", ""));
    if (currentWallet >= amount) {
      // Here you can make API call to withdraw money
      // const result = await apiService.withdrawMoney(amount);
      // setWallet(`₹${(currentWallet - amount).toFixed(2)}`);
    }
  };

  const handleWithdrawSuccessClose = () => {
    setShowWithdrawSuccessModalState(false);
    setWithdrawAmountState("");
    setActiveTabLocal("wallet"); // Redirect to wallet page to show updated balance
  };

  const calculateDepositDetails = (amount: number) => {
    const gst = Math.round(amount * 0.28);
    const cashback = amount >= 2000 ? Math.round(amount * 0.05) : 0;
    const total = amount + gst;
    return { gst, cashback, total };
  };

  const handlePaymentMethodSelectState = (method: string) => {
    setSelectedPaymentMethodState(method);
    setShowAddCashModalState(false);
    setShowPaymentModalState(true);
  };

  const handleUTRConfirmationState = () => {
    if (utrNumberState.length !== 12) {
      Alert.alert("Invalid UTR", "Please enter a valid 12-digit UTR number");
      return;
    }

    // Close payment modal and show success modal
    setShowPaymentModalState(false);
    setShowPaymentSuccessModalState(true);
  };

  const handlePaymentSuccessClose = () => {
    setShowPaymentSuccessModalState(false);
    setActiveTabLocal("home");
    setUtrNumberState("");
    setDepositAmountState("");
    setSelectedPaymentMethodState("");
    setShowAddCashModalState(false);
  };

  const handleUpdateProfile = async (profileData: any) => {
    try {
      // const result = await userService.updateProfile(profileData);
      // if (result.success) {
      setUserDataState(profileData);
      Alert.alert("Success", "Profile updated successfully!");
      // } else {
      //   Alert.alert('Error', result.error || 'Failed to update profile');
      // }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleCompleteKYC = () => {
    Alert.alert(
      "KYC Verification",
      "KYC verification process will be implemented soon",
    );
  };

  const handleAgeVerificationAcceptState = async () => {
    setIsAgeVerifiedState(true);
    setShowAgeVerificationState(false);

    // Store verification in AsyncStorage (implement in production)
    // await AsyncStorage.setItem('ageVerified', 'true');
  };

  const handleAgeVerificationReject = () => {
    Alert.alert(
      "Access Denied",
      "आप इस app का उपयोग नहीं कर सकते। यह केवल 18+ उम्र के लोगों के लिए है।",
      [
        {
          text: "Exit App",
          onPress: () => {
            // In a real app, you might want to close the app
            // For web, you could redirect to a different page
          },
        },
      ],
    );
  };

  const [showResultsModal, setShowResultsModal] = useState(false);

  const handleViewResults = () => {
    setShowResultsModal(true);
  };

  const renderContent = () => {
    switch (activeTabLocal) {
      case "home":
        return (
          <HomeScreen
            gameCards={GAME_CARDS}
            onPlayNow={handlePlayNow}
            isAuthenticated={isAuthenticated}
            user={user}
            onViewResults={handleViewResults}
            onNavigate={(screen: string) => setActiveTabLocal(screen)}
          />
        );
      case "game-history":
        return <GameHistory betHistory={betHistoryState} />;
      case "wallet":
        if (!isAuthenticated || !user) {
          return (
            <View style={styles.authRequiredContainer}>
              <View style={styles.authRequiredCard}>
                <TouchableOpacity
                  style={styles.authRequiredCloseButton}
                  onPress={() => setActiveTabLocal("home")}
                >
                  <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
                <Text style={styles.authRequiredIcon}>💰</Text>
                <Text style={styles.authRequiredTitle}>
                  Wallet Access Required
                </Text>
                <Text style={styles.authRequiredMessage}>
                  अपने wallet को access करने के लिए आपको login करना होगा। Login
                  करने के बाद आप अपना balance check कर सकते हैं, money add कर
                  सकते हैं और withdraw कर सकते हैं।
                </Text>
                <TouchableOpacity
                  style={styles.authRequiredButton}
                  onPress={() => {
                    setShowAuthRequired(true);
                    setShowAuthModalState(true);
                  }}
                >
                  <Text style={styles.authRequiredButtonText}>
                    🚀 Login करें
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        return (
          <View style={styles.walletContainer}>
            {/* Main Balance Display */}
            <View style={styles.mainBalanceCard}>
              <Text style={styles.walletTitle}>💰 My Wallet</Text>
              <Text style={styles.mainBalanceAmount}>{wallet}</Text>
              <Text style={styles.balanceSubtitle}>
                Total Available Balance
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.actionButtonAdd}
                onPress={() => setShowAddCashModalState(true)}
              >
                <Text style={styles.actionButtonIcon}>➕</Text>
                <Text style={[styles.actionButtonText, { color: "#000" }]}>
                  Add Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonWithdraw}
                onPress={() => setShowWithdrawModalState(true)}
              >
                <Text style={styles.actionButtonIcon}>💳</Text>
                <Text style={[styles.actionButtonText, { color: "#4A90E2" }]}>
                  Withdraw
                </Text>
              </TouchableOpacity>
            </View>

            {/* Balance Breakdown - Simplified */}
            <View style={styles.balanceBreakdownSimple}>
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                  <Text style={styles.breakdownIcon}>🏆</Text>
                  <View>
                    <Text style={styles.breakdownTitle}>Winnings</Text>
                    <Text style={styles.breakdownSubtitle}>Withdrawable</Text>
                  </View>
                </View>
                <Text style={styles.breakdownAmount}>₹1,250</Text>
              </View>

              <View style={styles.breakdownItem}>
                <View style={styles.breakdownLeft}>
                  <Text style={styles.breakdownIcon}>🎁</Text>
                  <View>
                    <Text style={styles.breakdownTitle}>Bonus</Text>
                    <Text style={styles.breakdownSubtitle}>Game only</Text>
                  </View>
                </View>
                <Text style={styles.breakdownAmountBonus}>₹500</Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStatsCard}>
              <Text style={styles.quickStatsTitle}>📊 Quick Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>15</Text>
                  <Text style={styles.statLabel}>Total Bets</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>8</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹2.8K</Text>
                  <Text style={styles.statLabel}>Total Won</Text>
                </View>
              </View>
            </View>
          </View>
        );
      case "mybets":
      case "history":
      case "bets":
        const isUserAuthenticated1 =
          (isAuthenticated && user && user.id);
        if (!isUserAuthenticated1) {
          return (
            <View style={styles.authRequiredContainer}>
              <View style={styles.authRequiredCard}>
                <Text style={styles.authRequiredIcon}>🔒</Text>
                <Text style={styles.authRequiredTitle}>Login Required</Text>
                <Text style={styles.authRequiredMessage}>
                  My Bets देखने के लिए आपको login करना होगा।
                </Text>
                <TouchableOpacity
                  style={styles.authRequiredButton}
                  onPress={() => {
                    setShowAuthRequired(true);
                    setShowAuthModalState(true);
                  }}
                >
                  <Text style={styles.authRequiredButtonText}>
                    🚀 Login करें
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        return <MyBet placedBets={placedBetsState} />;
      case "transactions":
        const isUserAuthenticated2 =
          (isAuthenticated && user && user.id);
        if (!isUserAuthenticated2) {
          return (
            <View style={styles.authRequiredContainer}>
              <View style={styles.authRequiredCard}>
                <Text style={styles.authRequiredIcon}>🔒</Text>
                <Text style={styles.authRequiredTitle}>Login Required</Text>
                <Text style={styles.authRequiredMessage}>
                  Transactions देखने के लिए आपको login करना होगा।
                </Text>
                <TouchableOpacity
                  style={styles.authRequiredButton}
                  onPress={() => {
                    setShowAuthRequired(true);
                    setShowAuthModalState(true);
                  }}
                >
                  <Text style={styles.authRequiredButtonText}>
                    🚀 Login करें
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        return <Transaction />;
      case "refer":
        return <ReferPage userData={userDataState} />;
      case "terms":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>📋 Terms & Conditions</Text>
            <View style={styles.policyContainer}>
              <Text style={styles.policySection}>🔞 Age Requirement</Text>
              <Text style={styles.policyText}>
                • You must be 18+ years old to use this app
              </Text>
              <Text style={styles.policyText}>
                • Age verification may be required
              </Text>

              <Text style={styles.policySection}>💰 Betting Rules</Text>
              <Text style={styles.policyText}>• Minimum bet amount is ₹10</Text>
              <Text style={styles.policyText}>
                • Maximum daily bet limit applies
              </Text>
              <Text style={styles.policyText}>
                • All bets are final once placed
              </Text>
              <Text style={styles.policyText}>
                • Results are declared as per official timing
              </Text>

              <Text style={styles.policySection}>💳 Payment Terms</Text>
              <Text style={styles.policyText}>
                • Deposits are processed instantly
              </Text>
              <Text style={styles.policyText}>
                • Withdrawals take 5-30 minutes
              </Text>
              <Text style={styles.policyText}>
                • GST charges apply on deposits
              </Text>
              <Text style={styles.policyText}>
                • TDS deducted as per government rules
              </Text>

              <Text style={styles.policySection}>⚠️ Responsible Gaming</Text>
              <Text style={styles.policyText}>
                • Set betting limits for yourself
              </Text>
              <Text style={styles.policyText}>
                • Never bet more than you can afford
              </Text>
              <Text style={styles.policyText}>
                • Seek help if gambling becomes a problem
              </Text>

              <Text style={styles.policySection}>🚫 Prohibited Activities</Text>
              <Text style={styles.policyText}>
                • Creating multiple accounts
              </Text>
              <Text style={styles.policyText}>
                • Using automated betting systems
              </Text>
              <Text style={styles.policyText}>
                • Attempting to manipulate results
              </Text>
            </View>
          </View>
        );
      case "privacy":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>🛡️ Privacy Policy</Text>
            <View style={styles.policyContainer}>
              <Text style={styles.policySection}>
                📋 Information We Collect
              </Text>
              <Text style={styles.policyText}>
                • Personal information (name, phone, email)
              </Text>
              <Text style={styles.policyText}>
                • Transaction history and betting records
              </Text>
              <Text style={styles.policyText}>
                • Device information and app usage data
              </Text>

              <Text style={styles.policySection}>
                🔒 How We Use Your Information
              </Text>
              <Text style={styles.policyText}>
                • To provide gaming services
              </Text>
              <Text style={styles.policyText}>
                • To process deposits and withdrawals
              </Text>
              <Text style={styles.policyText}>
                • To ensure account security
              </Text>
              <Text style={styles.policyText}>
                • To comply with legal requirements
              </Text>

              <Text style={styles.policySection}>🛡️ Data Protection</Text>
              <Text style={styles.policyText}>
                • We use industry-standard encryption
              </Text>
              <Text style={styles.policyText}>
                • Your data is stored securely
              </Text>
              <Text style={styles.policyText}>
                • We never share personal data with third parties
              </Text>

              <Text style={styles.policySection}>📞 Contact Us</Text>
              <Text style={styles.policyText}>
                For privacy concerns, contact our support team.
              </Text>
            </View>
          </View>
        );
      case "refund":
        return (
          <ScrollView
            style={styles.refundContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.tabTitle}>💳 Refund Policy</Text>
            <Text style={styles.pageSubtitle}>
              हमारी refund policy के नियम और शर्तें
            </Text>

            {/* Important Notice */}
            <View style={styles.noticeContainer}>
              <Text style={styles.noticeIcon}>⚠️</Text>
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>महत्वपूर्ण सूचना</Text>
                <Text style={styles.noticeText}>
                  यह एक gaming platform है। सभी bets और deposits के लिए विशेष
                  नियम लागू होते हैं।
                </Text>
              </View>
            </View>

            {/* Policy Sections */}
            <View style={styles.policyContainer}>
              <Text style={styles.policySection}>📋 Deposit Refund Policy</Text>
              <Text style={styles.policyText}>
                • Deposit के तुरंत बाद refund नहीं किया जा सकता
              </Text>
              <Text style={styles.policyText}>
                • Technical error के case में 24 घंटे के अंदर refund
              </Text>
              <Text style={styles.policyText}>
                • Duplicate payment के case में automatic refund
              </Text>
              <Text style={styles.policyText}>
                • Wrong payment के case में 2-3 working days में refund
              </Text>
              <Text style={styles.policyText}>
                • GST charges refund नहीं किए जाएंगे
              </Text>

              <Text style={styles.policySection}>
                🎮 Game Bet Refund Policy
              </Text>
              <Text style={styles.policyText}>
                • एक बार bet place होने के बाद cancel नहीं हो सकता
              </Text>
              <Text style={styles.policyText}>
                • Result declare होने के बाद कोई refund नहीं
              </Text>
              <Text style={styles.policyText}>
                • Technical issue के case में admin द्वारा review
              </Text>
              <Text style={styles.policyText}>
                • Wrong number selection की जिम्मेदारी user की है
              </Text>
              <Text style={styles.policyText}>
                • Game close होने के बाद bet cancel नहीं हो सकता
              </Text>

              <Text style={styles.policySection}>
                💰 Wallet Refund Scenarios
              </Text>
              <Text style={styles.policyText}>
                • Account ban के case में balance refund किया जाएगा
              </Text>
              <Text style={styles.policyText}>
                • Fraud activity detect होने पर no refund
              </Text>
              <Text style={styles.policyText}>
                • User द्वारा account delete पर balance withdrawal
              </Text>
              <Text style={styles.policyText}>
                • Legal issues के case में amount hold
              </Text>
              <Text style={styles.policyText}>
                • KYC incomplete होने पर withdrawal restrictions
              </Text>

              <Text style={styles.policySection}>
                ⏰ Refund Processing Time
              </Text>
              <Text style={styles.policyText}>• UPI refund: 2-24 hours</Text>
              <Text style={styles.policyText}>
                • Bank account refund: 3-7 working days
              </Text>
              <Text style={styles.policyText}>
                • Credit/Debit card refund: 5-10 working days
              </Text>
              <Text style={styles.policyText}>
                • E-wallet refund: Instant to 24 hours
              </Text>
              <Text style={styles.policyText}>
                • International payments: 10-15 working days
              </Text>

              <Text style={styles.policySection}>
                📝 Refund Request Process
              </Text>
              <Text style={styles.policyText}>
                • Customer support से contact करें
              </Text>
              <Text style={styles.policyText}>
                • Transaction ID और screenshot provide करें
              </Text>
              <Text style={styles.policyText}>
                • Valid reason के साथ request submit करें
              </Text>
              <Text style={styles.policyText}>
                • KYC documents की जरूरत हो सकती है
              </Text>
              <Text style={styles.policyText}>
                • Admin approval के बाद refund processing
              </Text>

              <Text style={styles.policySection}>❌ Non-Refundable Cases</Text>
              <Text style={styles.policyText}>
                • Winning amount dispute करना
              </Text>
              <Text style={styles.policyText}>• Fair play violations</Text>
              <Text style={styles.policyText}>• Multiple account creation</Text>
              <Text style={styles.policyText}>• Bonus amount misuse</Text>
              <Text style={styles.policyText}>
                • Terms & conditions violation
              </Text>

              <Text style={styles.policySection}>
                🔄 Partial Refund Conditions
              </Text>
              <Text style={styles.policyText}>• Service charges deduction</Text>
              <Text style={styles.policyText}>• Processing fees deduction</Text>
              <Text style={styles.policyText}>• GST amount non-refundable</Text>
              <Text style={styles.policyText}>• Bonus amount adjustment</Text>
              <Text style={styles.policyText}>
                • TDS deduction if applicable
              </Text>

              <Text style={styles.policySection}>📞 Refund Support</Text>
              <Text style={styles.policyText}>• WhatsApp: +91 98765 43210</Text>
              <Text style={styles.policyText}>
                • Telegram: @SattaKingSupport
              </Text>
              <Text style={styles.policyText}>
                • Email: refunds@sattaking.com
              </Text>
              <Text style={styles.policyText}>
                • Support timing: 24x7 available
              </Text>
              <Text style={styles.policyText}>
                • Response time: Within 2 hours
              </Text>

              <Text style={styles.policySection}>⚖️ Dispute Resolution</Text>
              <Text style={styles.policyText}>
                • सभी disputes का final decision admin का होगा
              </Text>
              <Text style={styles.policyText}>
                • Evidence के basis पर decision लिया जाएगा
              </Text>
              <Text style={styles.policyText}>
                • Legal proceedings की case में court jurisdiction
              </Text>
              <Text style={styles.policyText}>
                • Arbitration के through dispute resolution
              </Text>
              <Text style={styles.policyText}>
                • Company के terms के अनुसार final decision
              </Text>
            </View>

            {/* Contact Section */}
            <View style={styles.contactContainer}>
              <Text style={styles.contactTitle}>
                🆘 Refund के लिए Help चाहिए?
              </Text>
              <Text style={styles.contactText}>
                Refund के लिए हमारी customer support team से संपर्क करें। हमारी
                team 24x7 आपकी सेवा में है।
              </Text>

              <View style={styles.contactButtons}>
                <TouchableOpacity style={styles.whatsappButton}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  <Text style={styles.contactButtonText}>WhatsApp Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.telegramButton}>
                  <Ionicons name="paper-plane" size={20} color="#0088CC" />
                  <Text style={styles.contactButtonText}>Telegram Support</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Last Updated */}
            <View style={styles.lastUpdated}>
              <Text style={styles.lastUpdatedText}>
                Last Updated: January 2025
              </Text>
              <Text style={styles.lastUpdatedSubtext}>
                यह policy समय-समय पर update हो सकती है। Latest policy के लिए app
                check करते रहें।
              </Text>
            </View>
          </ScrollView>
        );
      case "games":
        const isUserAuthenticated3 =
          (isAuthenticated && user && user.id);
        if (!isUserAuthenticated3) {
          return (
            <View style={styles.authRequiredContainer}>
              <View style={styles.authRequiredCard}>
                <TouchableOpacity
                  style={styles.authRequiredCloseButton}
                  onPress={() => setActiveTabLocal("home")}
                >
                  <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
                <Text style={styles.authRequiredIcon}>🎮</Text>
                <Text style={styles.authRequiredTitle}>
                  Games Access Required
                </Text>
                <Text style={styles.authRequiredMessage}>
                  Games खेलने के लिए आपको login करना होगा। Login करने के बाद आप
                  सभी games खेल सकते हैं और bets लगा सकते हैं।
                </Text>
                <TouchableOpacity
                  style={styles.authRequiredButton}
                  onPress={() => {
                    setShowAuthRequired(true);
                    setShowAuthModalState(true);
                  }}
                >
                  <Text style={styles.authRequiredButtonText}>
                    🚀 Login करें
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        return <Games gameCards={gameCards} onGameSelect={handleGameSelect} />;
      case "profile":
        const isUserAuthenticated4 =
          (isAuthenticated && user && user.id);
        if (!isUserAuthenticated4) {
          return (
            <View style={styles.authRequiredContainer}>
              <View style={styles.authRequiredCard}>
                <TouchableOpacity
                  style={styles.authRequiredCloseButton}
                  onPress={() => setActiveTabLocal("home")}
                >
                  <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
                <Text style={styles.authRequiredIcon}>👤</Text>
                <Text style={styles.authRequiredTitle}>
                  Profile Access Required
                </Text>
                <Text style={styles.authRequiredMessage}>
                  अपनी profile को देखने और edit करने के लिए आपको login करना
                  होगा। आप अपनी details update कर सकते हैं और KYC complete कर
                  सकते हैं।
                </Text>
                <TouchableOpacity
                  style={styles.authRequiredButton}
                  onPress={() => {
                    setShowAuthRequired(true);
                    setShowAuthModalState(true);
                  }}
                >
                  <Text style={styles.authRequiredButtonText}>
                    🚀 Login करें
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        return (
          <Profile
            userData={userDataState}
            onUpdateProfile={handleUpdateProfile}
            onCompleteKYC={handleCompleteKYC}
          />
        );
      case "results":
        const isUserAuthenticated5 =
          (isAuthenticated && user && user.id);
        if (!isUserAuthenticated5) {
          return (
            <View style={styles.authRequiredContainer}>
              <View style={styles.authRequiredCard}>
                <Text style={styles.authRequiredIcon}>🔒</Text>
                <Text style={styles.authRequiredTitle}>Login Required</Text>
                <Text style={styles.authRequiredMessage}>
                  Results देखने के लिए आपको login करना होगा।
                </Text>
                <TouchableOpacity
                  style={styles.authRequiredButton}
                  onPress={() => {
                    setShowAuthRequired(true);
                    setShowAuthModalState(true);
                  }}
                >
                  <Text style={styles.authRequiredButtonText}>
                    🚀 Login करें
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        return (
          <ResultsModal
            visible={true}
            onClose={() => setActiveTabLocal("home")}
          />
        );
      case "help":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>🆘 Help & Support</Text>
            <View style={styles.helpContainer}>
              <Text style={styles.helpWelcome}>
                हमारी सपोर्ट टीम 24x7 आपकी सेवा में है!
              </Text>

              {/* Contact Methods */}
              <View style={styles.contactSection}>
                <Text style={styles.contactTitle}>📱 Contact Us</Text>

                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    // Open WhatsApp
                    Alert.alert(
                      "WhatsApp Support",
                      "WhatsApp पर संपर्क करने के लिए +91 98765 43210 पर मैसेज करें।",
                    );
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactMethod}>WhatsApp Support</Text>
                    <Text style={styles.contactDetails}>+91 98765 43210</Text>
                    <Text style={styles.contactTiming}>24x7 Available</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    // Open Telegram
                    Alert.alert(
                      "Telegram Support",
                      "Telegram पर @SattaKingSupport से संपर्क करें।",
                    );
                  }}
                >
                  <Ionicons name="paper-plane" size={24} color="#0088CC" />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactMethod}>Telegram Support</Text>
                    <Text style={styles.contactDetails}>@SattaKingSupport</Text>
                    <Text style={styles.contactTiming}>Instant Response</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* FAQ Section */}
              <View style={styles.faqSection}>
                <Text style={styles.faqTitle}>
                  ❓ Frequently Asked Questions
                </Text>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>
                    Q: How to deposit money?
                  </Text>
                  <Text style={styles.faqAnswer}>
                    A: Go to Wallet → Add Cash → Select UPI method → Enter
                    amount → Pay through UPI app
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>
                    Q: How long does withdrawal take?
                  </Text>
                  <Text style={styles.faqAnswer}>
                    A: Withdrawals are processed within 5-30 minutes to your
                    bank account.
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>
                    Q: What is minimum bet amount?
                  </Text>
                  <Text style={styles.faqAnswer}>
                    A: Minimum bet amount is ₹10 for all games.
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>
                    Q: When are results declared?
                  </Text>
                  <Text style={styles.faqAnswer}>
                    A: Results are declared as per official timing shown on each
                    game card.
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Q: Is my money safe?</Text>
                  <Text style={styles.faqAnswer}>
                    A: Yes, all transactions are secured with bank-level
                    encryption.
                  </Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <Text style={styles.quickActionsTitle}>⚡ Quick Actions</Text>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => setActiveTabLocal("transactions")}
                >
                  <Ionicons name="receipt" size={20} color="#4A90E2" />
                  <Text style={styles.quickActionText}>
                    Check Transaction History
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => setActiveTabLocal("mybets")}
                >
                  <Ionicons name="list" size={20} color="#4A90E2" />
                  <Text style={styles.quickActionText}>View My Bets</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => setActiveTabLocal("wallet")}
                >
                  <Ionicons name="wallet" size={20} color="#4A90E2" />
                  <Text style={styles.quickActionText}>
                    Check Wallet Balance
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.tabContent}>```text
            <Text style={styles.tabTitle}>🚧 Coming Soon</Text>
            <Text style={styles.comingSoonText}>यह फीचर जल्द ही आएगा</Text>
          </View>
        );
    }
  };

  const handleHeaderMenuItemPress = (key: string) => {
    console.log("Header menu item pressed:", key);

    // Allow access to these pages without authentication
    const publicPages = ["refer", "terms", "privacy", "refund", "help"];

    const isUserAuthenticated =
      (isAuthenticated && user && user.id);

    if (!isUserAuthenticated && !publicPages.includes(key)) {
      setShowAuthRequired(true);
      setShowAuthModalState(true);
      return;
    }

    if (key === "transactions") {
      setActiveTabLocal("transactions");
    } else if (key === "history") {
      setActiveTabLocal("game-history");
    } else if (key === "refer") {
      setActiveTabLocal("refer");
    } else if (key === "terms") {
      setActiveTabLocal("terms");
    } else if (key === "privacy") {
      setActiveTabLocal("privacy");
    } else if (key === "refund") {
      setActiveTabLocal("refund");
    } else if (key === "help") {
      setActiveTabLocal("help");
    } else if (key === "logout") {
      // Handle logout logic
      logout();```text
      // Clear all user-related states
      setShowAuthRequired(false);
      setActiveTabLocal("home");

      // Show logout success message
      Alert.alert(
        "✅ Logout Successful",
        "आप successfully logout हो गए हैं। अब आप फिर से login कर सकते हैं।",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Component */}
      <Header
        wallet={wallet}
        onMenuItemPress={handleHeaderMenuItemPress}
        isAuthenticated={isAuthenticated}
        user={user}
      />

      {/* Content */}
      <View style={styles.content}>
        {showKYCPageState ? (
          <KYCPage onBack={() => setShowKYCPageState(false)} />
        ) : (
          <>{renderContent()}</>
        )}
      </View>

      {/* Bottom Menu Component */}
      <BottomMenu
        activeTab={activeTabLocal}
        onMenuItemPress={handleMenuItemPress}
      />

      {/* Age Verification Overlay */}
      {!isAgeVerifiedState && !showAgeVerificationState && (
        <View style={styles.verificationOverlay}>
          <Text style={styles.overlayText}>Age verification required</Text>
        </View>
      )}

      {/* Betting Modal Component */}
      <BettingModal
        visible={showBettingModalState}
        selectedGame={selectedGameState}
        currentBetType={currentBetTypeState}
        betList={betListState}
        onClose={() => setShowBettingModalState(false)}
        onBetTypeChange={setCurrentBetTypeState}
        onNumberSelect={handleNumberSelect}
        onRemoveBet={removeBet}
        onPlaceBets={handlePlaceBets}
      />

      {/* Amount Selection Modal */}
      <Modal
        visible={showAmountModalState}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAmountModalState(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.amountModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Bet Amount - {selectedNumberState}
              </Text>
              <TouchableOpacity onPress={() => setShowAmountModalState(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.amountContent}>
              <View style={styles.betPreview}>
                <Text style={styles.betPreviewText}>
                  🎯 {selectedNumberState} ({currentBetTypeState})
                </Text>
                <Text style={styles.betPreviewGame}>
                  Game: {selectedGameState?.title}
                </Text>
              </View>

              <Text style={styles.amountLabel}>Quick Select:</Text>
              <View style={styles.amountButtonsGrid}>
                {[10, 50, 200, 300, 500, 1000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.amountButton}
                    onPress={() => handleBetPlace(amount)}
                  >
                    <Text style={styles.amountButtonText}>₹{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.amountLabel}>Custom Amount (Min ₹10):</Text>
              <TextInput
                style={styles.customAmountInput}
                placeholder="Enter amount"
                placeholderTextColor="#999"
                value={customAmountState}
                onChangeText={setCustomAmountState}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.customAmountButton}
                onPress={() => {
                  const amount = parseFloat(customAmountState);
                  if (amount >= 10) {
                    handleBetPlace(amount);
                    setCustomAmountState("");
                  } else {
                    Alert.alert("Invalid Amount", "Minimum bet amount is ₹10");
                  }
                }}
              >
                <Text style={styles.customAmountButtonText}>
                  Place Custom Bet
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Authentication Screen */}
      {(showAuthRequired || showAuthModalState) && (
        <AuthScreen
          visible={showAuthRequired || showAuthModalState}
          onAuthSuccess={handleAuthSuccess}
          onClose={() => {
            setShowAuthRequired(false);
            setShowAuthModalState(false);
          }}
        />
      )}

      {/* Wallet Operations Component */}
      <WalletOperations
        showAddCashModal={showAddCashModalState}
        showWithdrawModal={showWithdrawModalState}
        showPaymentModal={showPaymentModalState}
        depositAmount={depositAmountState}
        withdrawAmount={withdrawAmountState}
        selectedPaymentMethod={selectedPaymentMethodState}
        utrNumber={utrNumberState}
        onCloseAddCash={() => setShowAddCashModalState(false)}
        onCloseWithdraw={() => setShowWithdrawModalState(false)}
        onClosePayment={() => setShowPaymentModalState(false)}
        onDepositAmountChange={setDepositAmountState}
        onWithdrawAmountChange={setWithdrawAmountState}
        onPaymentMethodSelect={handlePaymentMethodSelectState}
        onUtrChange={setUtrNumberState}
        onConfirmPayment={handleUTRConfirmationState}
        onWithdrawRequest={handleWithdraw}
      />

      {/* Payment Success Component */}
      <PaymentSuccess
        visible={showPaymentSuccessModalState}
        amount={
          depositAmountState &&
          calculateDepositDetails(
            parseFloat(depositAmountState),
          ).total.toString()
        }
        utrNumber={utrNumberState}
        paymentMethod={selectedPaymentMethodState}
        onClose={handlePaymentSuccessClose}
      />

      {/* Withdraw Success Component */}
      <WithdrawSuccess
        visible={showWithdrawSuccessModalState}
        amount={withdrawAmountState}
        paymentMethod={selectedPaymentMethodState || "Selected UPI"}
        onClose={handleWithdrawSuccessClose}
      />

      {/* Age Verification Modal */}
      <AgeVerificationModal
        visible={showAgeVerificationState}
        onAccept={handleAgeVerificationAcceptState}
        onReject={handleAgeVerificationReject}
      />
      <BetSuccessModal
        visible={showBetSuccessState}
        betDetails={lastBetDetailsState}
        onClose={() => {
          setShowBetSuccessState(false);
          setActiveTabLocal("home");
          if (redirectTimer) {
            clearTimeout(redirectTimer);
            setRedirectTimer(null);
          }
        }}
      />
      {/* Results Modal */}
      <ResultsModal
        visible={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        isAuthenticated={isAuthenticated && user && user.id}
        onAuthRequired={() => {
          setShowResultsModal(false);
          setShowAuthModalState(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: isSmallDevice ? 10 : isMediumDevice ? 15 : 20,
    alignItems: "center",
  },
  tabTitle: {
    fontSize: isSmallDevice ? 20 : isMediumDevice ? 22 : 24,
    fontWeight: "bold",
    color: "#4A90E2",
    marginBottom: isSmallDevice ? 15 : 20,
  },
  walletContainer: {
    flex: 1,
    padding: isSmallDevice ? 10 : isMediumDevice ? 15 : 20,
  },
  mainBalanceCard: {
    backgroundColor: "#1a1a1a",
    padding: isSmallDevice ? 15 : isMediumDevice ? 20 : 25,
    borderRadius: isSmallDevice ? 10 : 15,
    alignItems: "center",
    marginBottom: isSmallDevice ? 15 : 20,
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  walletTitle: {
    color: "#4A90E2",
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  mainBalanceAmount: {
    color: "#00FF88",
    fontSize: isSmallDevice ? 24 : isMediumDevice ? 28 : 32,
    fontWeight: "bold",
    marginBottom: 5,
  },
  balanceSubtitle: {
    color: "#999",
    fontSize: isSmallDevice ? 12 : 14,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: isSmallDevice ? 10 : 15,
    marginBottom: isSmallDevice ? 15 : 20,
  },
  actionButtonAdd: {
    flex: 1,
    backgroundColor: "#00FF88",
    padding: isSmallDevice ? 12 : 15,
    borderRadius: isSmallDevice ? 8 : 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: isSmallDevice ? 6 : 8,
    minHeight: isSmallDevice ? 45 : 50,
  },
  actionButtonWithdraw: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: isSmallDevice ? 12 : 15,
    borderRadius: isSmallDevice ? 8 : 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: isSmallDevice ? 6 : 8,
    borderWidth: 1,
    borderColor: "#4A90E2",
    minHeight: isSmallDevice ? 45 : 50,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  balanceBreakdownSimple: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  breakdownIcon: {
    fontSize: 20,
  },
  breakdownTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  breakdownSubtitle: {
    color: "#999",
    fontSize: 12,
  },
  breakdownAmount: {
    color: "#00FF88",
    fontSize: 16,
    fontWeight: "bold",
  },
  breakdownAmountBonus: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  quickStatsCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  quickStatsTitle: {
    color: "#4A90E2",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#00FF88",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statLabel: {
    color: "#999",
    fontSize: 12,
  },
  totalBalanceCard: {
    backgroundColor: "#1a1a1a",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4A90E2",
    width: "100%",
  },
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  balanceCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  totalBalanceTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4A90E2",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  totalBalanceAmount: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#00FF88",
    marginBottom: 4,
  },
  totalBalanceSubtitle: {
    color: "#999",
    fontSize: 10,
  },
  balanceBreakdown: {
    width: "100%",
    marginBottom: 30,
  },
  balanceItem: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  balanceItemTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4A90E2",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  balanceItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  balanceItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  winningsAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00FF88",
    marginBottom: 4,
  },
  bonusAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 4,
  },
  balanceItemSubtitle: {
    color: "#999",
    fontSize: 9,
    lineHeight: 14,
  },
  walletActionsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 10,
    marginBottom: 20,
    position: "relative",
    zIndex: 1,
  },
  addCashButton: {
    flex: 1,
    backgroundColor: "#00FF88",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addCashButtonText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  withdrawButtonText: {
    color: "#4A90E2",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  historyItem: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  historyNumber: {
    color: "#4A90E2",
    fontSize: 16,
    fontWeight: "bold",
  },
  historyGame: {
    color: "#999",
    fontSize: 12,
  },
  historyAmount: {
    color: "#00FF88",
    fontSize: 14,
    fontWeight: "bold",
  },
  noHistory: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  profileCard: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    width: "100%",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A90E2",
    marginBottom: 10,
  },
  profilePhone: {
    color: "#999",
    fontSize: 16,
    marginBottom: 20,
  },
  profileButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  profileButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  comingSoonText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: isSmallDevice ? 10 : 20,
  },
  amountModal: {
    backgroundColor: "#0a0a0a",
    width: isSmallDevice ? "95%" : "90%",
    maxWidth: 500,
    borderRadius: isSmallDevice ? 10 : 15,
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: isSmallDevice ? 15 : 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: "bold",
    color: "#4A90E2",
    flex: 1,
  },
  amountContent: {
    padding: isSmallDevice ? 15 : 20,
  },
  betPreview: {
    backgroundColor: "#1a1a1a",
    padding: isSmallDevice ? 12 : 15,
    borderRadius: isSmallDevice ? 8 : 10,
    marginBottom: isSmallDevice ? 15 : 20,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  betPreviewText: {
    color: "#4A90E2",
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  betPreviewGame: {
    color: "#999",
    fontSize: isSmallDevice ? 10 : 12,
  },
  amountLabel: {
    color: "#4A90E2",
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  amountButtonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: isSmallDevice ? 15 : 20,
  },
  amountButton: {
    width: isSmallDevice ? "31%" : "30%",
    backgroundColor: "#1a1a1a",
    paddingVertical: isSmallDevice ? 10 : 12,
    borderRadius: isSmallDevice ? 6 : 8,
    alignItems: "center",
    marginBottom: isSmallDevice ? 6 : 8,
    borderWidth: 1,
    borderColor: "#00FF88",
    minHeight: isSmallDevice ? 35 : 40,
  },
  amountButtonText: {
    color: "#00FF88",
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: "bold",
  },
  customAmountInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: isSmallDevice ? 6 : 8,
    paddingHorizontal: isSmallDevice ? 12 : 15,
    paddingVertical: isSmallDevice ? 10 : 12,
    color: "#fff",
    fontSize: isSmallDevice ? 14 : 16,
    marginBottom: isSmallDevice ? 12 : 15,
    minHeight: isSmallDevice ? 40 : 45,
  },
  customAmountButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: isSmallDevice ? 12 : 15,
    borderRadius: isSmallDevice ? 6 : 8,
    alignItems: "center",
    minHeight: isSmallDevice ? 40 : 45,
  },
  customAmountButtonText: {
    color: "#000",
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: "bold",
  },
  authModalContainer: {
    backgroundColor: "#0a0a0a",
    width: "95%",
    maxHeight: "90%",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  authModalContent: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    flex: 1,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A90E2",
    textAlign: "center",
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 12,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  switchModeText: {
    color: "#00FF88",
    fontSize: 14,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  referBenefitsContainer: {
    marginBottom: 20,
  },
  benefitItem: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD700",
  },
  benefitTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  benefitDescription: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 18,
  },
  referralStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    width: "48%",
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  statMainNumber: {
    color: "#00FF88",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statMainLabel: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
  },
  referralCodeSection: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  referralCodeTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  referralCodeSubtitle: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  codeDisplayContainer: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  referralCodeDisplay: {
    color: "#00FF88",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
  },
  referralActions: {
    gap: 10,
  },
  copyCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  copyCodeText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  shareWhatsAppButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  shareWhatsAppText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  shareTelegramButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0088CC",
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareTelegramText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  howItWorksSection: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#333",
  },
  howItWorksTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  stepsContainer: {
    gap: 15,
  },
  workStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },
  workStepNumber: {
    backgroundColor: "#4A90E2",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: "center",
    lineHeight: 30,
  },
  workStepContent: {
    flex: 1,
  },
  workStepTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  workStepDescription: {
    color: "#999",
    fontSize: 14,
    lineHeight: 18,
  },
  commissionStructure: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#00FF88",
  },
  commissionTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  commissionItems: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  commissionItem: {
    alignItems: "center",
  },
  commissionAmount: {
    color: "#00FF88",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  commissionLabel: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
  },

  // Policy & Terms Styles
  policyContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  policySection: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  policyText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    paddingLeft: 10,
  },

  // Help & Support Styles
  helpContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  helpWelcome: {
    color: "#00FF88",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  contactSection: {
    marginBottom: 25,
  },
  contactTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  contactButton: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  contactInfo: {
    marginLeft: 15,
    flex: 1,
  },
  contactMethod: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  contactDetails: {
    color: "#4A90E2",
    fontSize: 14,
    marginBottom: 2,
  },
  contactTiming: {
    color: "#00FF88",
    fontSize: 12,
  },
  faqSection: {
    marginBottom: 25,
  },
  faqTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  faqItem: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  faqQuestion: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  faqAnswer: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  quickActionText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 10,
  },
  verificationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  // Refund Policy Styles
  refundContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    padding: isSmallDevice ? 15 : 20,
  },
  pageSubtitle: {
    fontSize: isSmallDevice ? 14 : 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 25,
  },
  noticeContainer: {
    flexDirection: "row",
    backgroundColor: "#2a1a00",
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  noticeIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  noticeText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  contactContainer: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  contactText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  contactButtons: {
    gap: 10,
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    padding: 12,
    borderRadius: 8,
  },
  telegramButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0088CC",
    padding: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  lastUpdated: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  lastUpdatedText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  lastUpdatedSubtext: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },

  // Authentication Required Styles
  authRequiredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0a0a0a",
  },
  authRequiredCard: {
    backgroundColor: "#1a1a1a",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4A90E2",
    maxWidth: 350,
    width: "100%",
    position: "relative",
  },
  authRequiredCloseButton: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 1,
  },
  authRequiredIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A90E2",
    marginBottom: 15,
    textAlign: "center",
  },
  authRequiredMessage: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
  },
  authRequiredButton: {
    backgroundColor: "#00FF88",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    boxShadow: "0 4px 8px rgba(0, 255, 136, 0.3)",
  },
  authRequiredButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
});