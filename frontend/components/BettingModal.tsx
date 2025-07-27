import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface BettingModalProps {
  visible: boolean;
  selectedGame: any;
  currentBetType: string;
  betList: any[];
  onClose: () => void;
  onBetTypeChange: (type: string) => void;
  onNumberSelect: (number: any, type: string, amount: number) => void;
  onRemoveBet: (betId: number) => void;
  onPlaceBets: () => void;
}

export default function BettingModal({
  visible,
  selectedGame,
  currentBetType,
  betList,
  onClose,
  onBetTypeChange,
  onNumberSelect,
  onRemoveBet,
  onPlaceBets
}: BettingModalProps) {
  const [showAmountPopup, setShowAmountPopup] = React.useState(false);
  const [selectedNumber, setSelectedNumber] = React.useState<any>(null);
  const [selectedType, setSelectedType] = React.useState<string>('');
  const [customAmount, setCustomAmount] = React.useState<string>('');

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const particleAnim = React.useRef(new Animated.Value(0)).current;

  // Animation effects
  React.useEffect(() => {
    if (visible) {
      // Entry animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        })
      ]).start();

      // Continuous glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          })
        ])
      ).start();

      // Particle animation
      Animated.loop(
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        })
      ).start();

    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(height);
    }
  }, [visible]);

  // Pulse animation for buttons
  const startPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      })
    ]).start();
  };

  React.useEffect(() => {
    if (!visible) {
      setShowAmountPopup(false);
      setSelectedNumber(null);
      setSelectedType('');
      setCustomAmount('');
    }
  }, [visible]);

  const getTotalBetAmount = () => {
    return betList.reduce((total, bet) => total + bet.amount, 0);
  };

  const getNumberButtonStyle = (number: number) => {
    const baseHue = (number * 137.5) % 360;
    const isEven = number % 2 === 0;
    const isPrime = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97].includes(number);

    let gradientColors, borderColor, shadowColor;

    if (isPrime) {
      gradientColors = ['#FFD700', '#FFA500', '#FF8C00'];
      borderColor = '#FFD700';
      shadowColor = '#FFD700';
    } else if (isEven) {
      gradientColors = ['#00BFFF', '#0080FF', '#0066CC'];
      borderColor = '#00BFFF';
      shadowColor = '#00BFFF';
    } else {
      gradientColors = ['#8A2BE2', '#9932CC', '#7B68EE'];
      borderColor = '#8A2BE2';
      shadowColor = '#8A2BE2';
    }

    return {
      backgroundColor: gradientColors[0], // Fallback for React Native Web
      borderWidth: 2,
      borderColor,
      shadowColor,
      boxShadow: '0 8px 15px rgba(138,43,226,0.8)',
      elevation: 12,
    };
  };

  const getNumberTextColor = (number: number) => {
    const isPrime = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97].includes(number);
    return isPrime ? '#000000' : '#FFFFFF';
  };

  const renderNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= 100; i++) {
      const bet = betList.find(b => b.number === i && b.type === 'numbers');
      const isSelected = !!bet;
      numbers.push(
        <Animated.View
          key={i}
          style={[
            styles.numberButtonContainer,
            { transform: [{ scale: isSelected ? 1.05 : 1 }] }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.numberButton,
              getNumberButtonStyle(i),
              isSelected && styles.selectedNumberButton
            ]}
            onPress={() => {
              startPulse();
              if (isSelected) {
                onRemoveBet(bet.id);
              } else {
                setSelectedNumber(i);
                setSelectedType('numbers');
                setShowAmountPopup(true);
              }
            }}
            activeOpacity={0.8}
          >
            {/* Particle effect for selected numbers */}
            {isSelected && (
              <Animated.View style={[
                styles.particleEffect,
                {
                  opacity: particleAnim,
                  transform: [{
                    rotate: particleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]}>
                <View style={styles.particle} />
                <View style={[styles.particle, { top: 10, left: 10 }]} />
                <View style={[styles.particle, { top: -5, right: 5 }]} />
              </Animated.View>
            )}

            <Text style={[
              styles.numberText,
              { color: getNumberTextColor(i) },
              isSelected && styles.selectedNumberText
            ]}>{i}</Text>

            {isSelected && (
              <Animated.View style={[
                styles.betAmountBadge,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}>
                <Text style={styles.betAmountBadgeText}>₹{bet.amount}</Text>
              </Animated.View>
            )}

            {/* Glow effect */}
            <Animated.View style={[
              styles.glowEffect,
              {
                opacity: isSelected ? glowAnim : 0,
              }
            ]} />
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return numbers;
  };

  const renderAndarNumbers = () => {
    const numbers = [];
    for (let i = 0; i <= 9; i++) {
      const numberKey = `Andar ${i}`;
      const bet = betList.find(b => b.number === numberKey && b.type === 'andar');
      const isSelected = !!bet;
      numbers.push(
        <Animated.View
          key={numberKey}
          style={[
            styles.andarBaharItemContainer,
            { transform: [{ scale: isSelected ? 1.05 : 1 }] }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.andarBaharButton,
              styles.andarButton,
              isSelected && styles.selectedAndarButton
            ]}
            onPress={() => {
              startPulse();
              if (isSelected) {
                onRemoveBet(bet.id);
              } else {
                setSelectedNumber(numberKey);
                setSelectedType('andar');
                setShowAmountPopup(true);
              }
            }}
            activeOpacity={0.8}
          >
            {/* Animated background */}
            <Animated.View style={[
              styles.animatedBackground,
              styles.andarBackground,
              {
                opacity: isSelected ? 1 : 0.3,
                transform: [{
                  scale: isSelected ? glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1]
                  }) : 1
                }]
              }
            ]} />

            <Text style={[
              styles.andarBaharText,
              isSelected && styles.selectedAndarText
            ]}>{i}</Text>

            {isSelected && (
              <Animated.View style={[
                styles.betAmountBadgeSmall,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <Text style={styles.betAmountBadgeTextSmall}>₹{bet.amount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return numbers;
  };

  const renderBaharNumbers = () => {
    const numbers = [];
    for (let i = 0; i <= 9; i++) {
      const numberKey = `Bahar ${i}`;
      const bet = betList.find(b => b.number === numberKey && b.type === 'bahar');
      const isSelected = !!bet;
      numbers.push(
        <Animated.View
          key={numberKey}
          style={[
            styles.andarBaharItemContainer,
            { transform: [{ scale: isSelected ? 1.05 : 1 }] }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.andarBaharButton,
              styles.baharButton,
              isSelected && styles.selectedBaharButton
            ]}
            onPress={() => {
              startPulse();
              if (isSelected) {
                onRemoveBet(bet.id);
              } else {
                setSelectedNumber(numberKey);
                setSelectedType('bahar');
                setShowAmountPopup(true);
              }
            }}
            activeOpacity={0.8}
          >
            {/* Animated background */}
            <Animated.View style={[
              styles.animatedBackground,
              styles.baharBackground,
              {
                opacity: isSelected ? 1 : 0.3,
                transform: [{
                  scale: isSelected ? glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1]
                  }) : 1
                }]
              }
            ]} />

            <Text style={[
              styles.andarBaharText,
              isSelected && styles.selectedBaharText
            ]}>{i}</Text>

            {isSelected && (
              <Animated.View style={[
                styles.betAmountBadgeSmall,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <Text style={styles.betAmountBadgeTextSmall}>₹{bet.amount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    }
    return numbers;
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[
        styles.modalOverlay,
        {
          opacity: fadeAnim,
          backgroundColor: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.95)']
          })
        }
      ]}>


        <Animated.View style={[
          styles.bettingModal,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}>
          {/* Animated header with gradient */}
          <Animated.View style={[
            styles.modalHeader,
            {
              transform: [{
                scale: pulseAnim
              }]
            }
          ]}>
            <View style={styles.headerGradient} />
            <View style={styles.headerContent}>
              <Text style={styles.modalTitle}>
                🎯 {selectedGame?.title} - Select Numbers
              </Text>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeIconContainer}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Animated border */}
            <Animated.View style={[
              styles.headerBorder,
              {
                opacity: glowAnim,
              }
            ]} />
          </Animated.View>

          <View style={styles.modalContent}>
            {/* Gaming style tabs */}
            <View style={styles.bettingTabs}>
              <View style={styles.tabsBackground} />
              {['numbers', 'andar', 'bahar'].map((type, index) => (
                <TouchableOpacity 
                  key={type}
                  style={[
                    styles.tab,
                    currentBetType === type && styles.activeTab
                  ]}
                  onPress={() => {
                    startPulse();
                    onBetTypeChange(type);
                  }}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[
                    styles.tabIndicator,
                    {
                      opacity: currentBetType === type ? 1 : 0,
                      transform: [{
                        scale: currentBetType === type ? glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05]
                        }) : 0.8
                      }]
                    }
                  ]} />
                  <Text style={[
                    styles.tabText,
                    currentBetType === type && styles.activeTabText
                  ]}>
                    {type === 'numbers' ? '🎯 Numbers (1-100)' : 
                     type === 'andar' ? '🟢 Andar (0-9)' : '🔴 Bahar (0-9)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.contentScrollView} showsVerticalScrollIndicator={false}>
              {/* Bet summary with animations */}
              {betList.length > 0 && (
                <Animated.View style={[
                  styles.selectionSummary,
                  {
                    transform: [{
                      scale: pulseAnim
                    }]
                  }
                ]}>
                  <View style={styles.summaryGradient} />
                  <Text style={styles.summaryTitle}>
                    🎲 Total Bets ({betList.length}):
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.selectedNumbersList}>
                      {betList.map((bet, index) => {
                        const chipStyle = bet.type === 'andar' ? styles.andarChip : 
                                        bet.type === 'bahar' ? styles.baharChip : 
                                        styles.selectedChip;
                        return (
                          <Animated.View 
                            key={index} 
                            style={[
                              chipStyle,
                              {
                                transform: [{
                                  scale: glowAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.05]
                                  })
                                }]
                              }
                            ]}
                          >
                            <Text style={styles.selectedChipText}>{bet.number}</Text>
                            <Text style={styles.selectedChipAmount}>₹{bet.amount}</Text>
                          </Animated.View>
                        );
                      })}
                    </View>
                  </ScrollView>
                  <Animated.View style={[
                    styles.totalAmountDisplay,
                    {
                      transform: [{
                        scale: pulseAnim
                      }]
                    }
                  ]}>
                    <Text style={styles.totalAmountText}>
                      💰 Total Bet Amount: ₹{getTotalBetAmount()}
                    </Text>
                  </Animated.View>
                </Animated.View>
              )}

              {/* Numbers grid with animations */}
              {currentBetType === 'numbers' && (
                <>
                  <Animated.Text style={[
                    styles.sectionTitle,
                    {
                      transform: [{
                        scale: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02]
                        })
                      }]
                    }
                  ]}>🎯 Select Numbers (1-100)</Animated.Text>
                  <View style={styles.numbersContainer}>
                    <ScrollView style={styles.numbersScrollContainer} showsVerticalScrollIndicator={false}>
                      <View style={styles.numbersGrid}>
                        {renderNumbers()}
                      </View>
                    </ScrollView>
                  </View>
                </>
              )}

              {currentBetType === 'andar' && (
                <>
                  <Animated.Text style={[
                    styles.sectionTitle,
                    {
                      transform: [{
                        scale: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02]
                        })
                      }]
                    }
                  ]}>🟢 Andar (0-9)</Animated.Text>
                  <View style={styles.andarBaharHorizontalGrid}>
                    {renderAndarNumbers()}
                  </View>
                </>
              )}

              {currentBetType === 'bahar' && (
                <>
                  <Animated.Text style={[
                    styles.sectionTitle,
                    {
                      transform: [{
                        scale: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02]
                        })
                      }]
                    }
                  ]}>🔴 Bahar (0-9)</Animated.Text>
                  <View style={styles.andarBaharHorizontalGrid}>
                    {renderBaharNumbers()}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Animated place bet button */}
            {betList.length > 0 && (
              <Animated.View style={[
                styles.fixedBottomSection,
                {
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, height],
                      outputRange: [0, 100]
                    })
                  }]
                }
              ]}>
                <TouchableOpacity 
                  style={[styles.placeBetButton]}
                  onPress={() => {
                    startPulse();
                    if (betList.length > 0) {
                      onPlaceBets();
                      onClose();
                    } else {
                      Alert.alert('No Bets', 'कोई bet select नहीं किया गया है।');
                    }
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.buttonGradient} />
                  <Animated.View style={[
                    styles.buttonGlow,
                    {
                      opacity: glowAnim,
                    }
                  ]} />
                  <Text style={styles.placeBetButtonText}>
                    🚀 Place All Bets (₹{getTotalBetAmount()})
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {/* Enhanced Amount Selection Popup */}
      <Modal
        visible={showAmountPopup}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowAmountPopup(false)}
      >
        <Animated.View style={[
          styles.popupOverlay,
          {
            opacity: showAmountPopup ? 1 : 0,
          }
        ]}>
          <Animated.View style={[
            styles.amountPopup,
            {
              transform: [{
                scale: showAmountPopup ? 1 : 0.8
              }]
            }
          ]}>
            <View style={styles.popupGradient} />
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>
                💰 Bet Amount - {selectedNumber}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowAmountPopup(false)} 
                style={styles.popupCloseIcon}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.popupContent}>
              <Text style={styles.amountLabel}>⚡ Quick Select:</Text>
              <View style={styles.quickAmountGrid}>
                {[10, 50, 100, 200, 500, 1000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => {
                      startPulse();
                      onNumberSelect(selectedNumber, selectedType, amount);
                      setShowAmountPopup(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.quickButtonGradient} />
                    <Text style={styles.quickAmountText}>₹{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.amountLabel}>✏️ Custom Amount (₹10 - ₹5000):</Text>
              <TextInput
                style={styles.customAmountInput}
                placeholder="Enter amount"
                placeholderTextColor="#666666"
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
              />

              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => {
                  const amount = parseInt(customAmount);
                  if (amount >= 10 && amount <= 5000) {
                    startPulse();
                    onNumberSelect(selectedNumber, selectedType, amount);
                    setCustomAmount('');
                    setShowAmountPopup(false);
                  } else {
                    Alert.alert('Invalid Amount', 'Please enter amount between ₹10 and ₹5000');
                  }
                }}
                activeOpacity={0.9}
              >
                <View style={styles.confirmButtonGradient} />
                <Text style={styles.confirmButtonText}>🎯 Confirm Bet</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundParticles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  backgroundParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
  },
  bettingModal: {
    backgroundColor: '#000000',
    width: '95%',
    maxHeight: '90%',
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFD700',
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        boxShadow: '0 25px 80px rgba(255, 215, 0, 0.4)',
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHeader: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
  },
  headerBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFD700',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    flex: 1,
    textShadow: '0 2px 4px rgba(255, 215, 0, 0.5)',
  },
  closeIconContainer: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  contentScrollView: {
    flex: 1,
  },
  bettingTabs: {
    flexDirection: 'row',
    marginBottom: 25,
    position: 'relative',
    borderRadius: 15,
    overflow: 'hidden',
  },
  tabsBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD700',
    borderRadius: 12,
  },
  tabText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 1,
  },
  activeTabText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  selectionSummary: {
    position: 'relative',
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  summaryGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
  },
  summaryTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
    textShadow: '0 1px 2px rgba(255, 215, 0, 0.3)',
    zIndex: 1,
  },
  selectedNumbersList: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  selectedChip: {
    backgroundColor: '#333333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
  },
  andarChip: {
    backgroundColor: '#0f2419',
    borderColor: '#00ff88',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)',
  },
  baharChip: {
    backgroundColor: '#241f0f',
    borderColor: '#ff6b6b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
  },
  selectedChipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  selectedChipAmount: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
  },
  totalAmountDisplay: {
    marginTop: 15,
    alignItems: 'center',
    zIndex: 1,
  },
  totalAmountText: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: '900',
    textShadow: '0 2px 4px rgba(0, 255, 136, 0.5)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
    textShadow: '0 2px 4px rgba(255, 215, 0, 0.5)',
  },
  numbersContainer: {
    flex: 1,
    maxHeight: 350,
  },
  numbersScrollContainer: {
    flex: 1,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  numberButtonContainer: {
    width: '19.5%',
    aspectRatio: 1,
    marginBottom: 12,
  },
  numberButton: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedNumberButton: {
    borderWidth: 3,
    borderColor: '#00ff88',
    boxShadow: '0 0 25px rgba(0, 255, 136, 0.8)',
  },
  particleEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFD700',
    top: 5,
    left: 5,
  },
  glowEffect: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  numberText: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    zIndex: 1,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },
  selectedNumberText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  betAmountBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(0, 255, 136, 0.9)',
    borderRadius: 6,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  betAmountBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  andarBaharGrid: {
    flexDirection: 'column',
    gap: 10,
  },
  andarBaharHorizontalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  andarBaharContainer: {
    width: '100%',
    height: 50,
    marginBottom: 8,
  },
  andarBaharItemContainer: {
    minWidth: 60,
    maxWidth: 'max-content',
    height: 60,
    marginBottom: 12,
  },
  andarBaharButton: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    minWidth: 60,
    paddingHorizontal: 8,
  },
  andarButton: {
    backgroundColor: '#0f2419',
    borderColor: '#00ff88',
  },
  baharButton: {
    backgroundColor: '#241f0f',
    borderColor: '#ff6b6b',
  },
  selectedAndarButton: {
    borderWidth: 3,
    borderColor: '#00ff88',
    boxShadow: '0 0 25px rgba(0, 255, 136, 0.8)',
  },
  selectedBaharButton: {
    borderWidth: 3,
    borderColor: '#ff6b6b',
    boxShadow: '0 0 25px rgba(255, 107, 107, 0.8)',
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 13,
  },
  andarBackground: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
  },
  baharBackground: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  andarBaharText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 1,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },
  selectedAndarText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
  selectedBaharText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  betAmountBadgeSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  betAmountBadgeTextSmall: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '700',
  },
  fixedBottomSection: {
    borderTopWidth: 2,
    borderTopColor: '#FFD700',
    padding: 20,
    marginHorizontal: -20,
    marginBottom: -20,
    backgroundColor: '#000000',
  },
  placeBetButton: {
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 50%, #00ff88 100%)',
  },
  buttonGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
  },
  placeBetButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    zIndex: 1,
    textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountPopup: {
    backgroundColor: '#000000',
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
    boxShadow: '0 20px 60px rgba(255, 215, 0, 0.4)',
    position: 'relative',
  },
  popupGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
    zIndex: 1,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFD700',
    flex: 1,
    textShadow: '0 1px 2px rgba(255, 215, 0, 0.3)',
  },
  popupCloseIcon: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  popupContent: {
    padding: 25,
    zIndex: 1,
  },
  amountLabel: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
    textShadow: '0 1px 2px rgba(255, 215, 0, 0.3)',
  },
  quickAmountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  quickAmountButton: {
    width: '30%',
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  quickButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #333333 0%, #4d4d4d 50%, #333333 100%)',
  },
  quickAmountText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '800',
    zIndex: 1,
    textShadow: '0 1px 2px rgba(255, 215, 0, 0.3)',
  },
  customAmountInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
  },
  confirmButton: {
    height: 55,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  confirmButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 50%, #FF6B6B 100%)',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    zIndex: 1,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },
});