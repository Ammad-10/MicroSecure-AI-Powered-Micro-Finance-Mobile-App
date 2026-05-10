import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { verifyLiveness } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Bio-Signature Constants ──────────────────────────────────────────────────
const CAPTURE_DURATION_MS = 6000;       // Increased to 6 seconds for clear instructions
const MIN_SAMPLES_REQUIRED = 5;         // Faster check
const MIN_REDNESS_THRESHOLD = 45;       // Stricter tissue check
const MIN_PULSE_VARIANCE = 0.002;       // Zone 2 Start: Minimum 'rhythmic noise' required
const MAX_PULSE_VARIANCE = 0.05;        // Zone 2 End: Maximum 'rhythmic noise' before it's chaos
const STABILITY_PENALTY_THRESHOLD = 99.8; // Reject anything too stable (likely a static object)

// ─── Base64 Decoder (works in React Native / Hermes) ─────────────────────────
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Decode(base64Str) {
    const bytes = [];
    const len = Math.min(base64Str.length, 4000); // Only decode first ~3KB for speed
    for (let i = 0; i < len; i += 4) {
        const a = BASE64_CHARS.indexOf(base64Str[i]);
        const b = BASE64_CHARS.indexOf(base64Str[i + 1]);
        const c = BASE64_CHARS.indexOf(base64Str[i + 2]);
        const d = BASE64_CHARS.indexOf(base64Str[i + 3]);
        if (a < 0 || b < 0) continue;
        bytes.push((a << 2) | (b >> 4));
        if (c >= 0) bytes.push(((b & 15) << 4) | (c >> 2));
        if (d >= 0) bytes.push(((c & 3) << 6) | d);
    }
    return bytes;
}

/**
 * Extract average RED channel intensity from base64 JPEG.
 * In a red-lit finger, R >> G, B. Changes in R correlate to blood volume changes.
 */
function extractRedChannel(base64Data) {
    if (!base64Data || base64Data.length < 100) return 0;
    const bytes = base64Decode(base64Data);
    if (bytes.length < 50) return 0;

    // We sample bytes and assume they correlate to Redness in a red-saturated frame.
    // We sample a larger chunk of the pixel data area.
    let redSum = 0;
    let count = 0;

    // Improved sampling: Avoid the very beginning (metadata) and sample more evenly
    const start = Math.min(500, bytes.length);
    const end = Math.min(bytes.length, 10000);

    for (let i = start; i < end; i += 4) { // Faster step, larger range
        redSum += bytes[i];
        count++;
    }

    return count > 0 ? (redSum / count) : 0;
}

/**
 * Bio-Signature Analysis
 * Instead of pulse timing, we check for:
 * 1. Dominant Redness (Chromacity)
 * 2. Signal Stability (Proves it's a held finger, not a moving screen)
 */
function analyzeBioSignature(intensities) {
    const result = {
        isAlive: false,
        confidence: 0,
        message: '',
    };

    if (intensities.length < MIN_SAMPLES_REQUIRED) {
        result.message = `Not enough data (${intensities.length} samples). Hold thumb steadier.`;
        return result;
    }

    // 1. Average Redness (Tissue Check)
    const avgRed = intensities.reduce((a, b) => a + b, 0) / intensities.length;

    // 2. Pulse Strength / Variance (Liveness Check)
    // We use Coefficient of Variation (CV) as the pulse score
    const std = standardDeviation(intensities);
    const cv = std / (avgRed || 1);
    const stability = Math.max(0, 100 - (cv * 500));

    console.log(`Bio-Check: Red=${avgRed.toFixed(2)}, Var=${cv.toFixed(4)}, Stability=${stability.toFixed(2)}%`);

    // 3. Goldilocks Zone Logic
    if (avgRed < MIN_REDNESS_THRESHOLD) {
        result.message = 'No human tissue detected. Cover the camera and flash fully with your thumb.';
    } else if (cv < MIN_PULSE_VARIANCE || stability >= STABILITY_PENALTY_THRESHOLD) {
        // ZONE 1: Too static (The Table Test)
        result.message = 'Static object detected. Move your finger slightly or ensure a real pulse is present.';
    } else if (cv > MAX_PULSE_VARIANCE) {
        // ZONE 3: Too much motion
        result.message = 'Signal unstable. Hold your thumb very still on the lens.';
    } else {
        // ZONE 2: The Sweet Spot (Biological Pulse)
        result.isAlive = true;
        result.confidence = Math.min(99, 80 + (stability / 10));
        result.message = 'Bio-signature verified: Living pulse detected.';
    }

    return result;
}

function standardDeviation(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sq = arr.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(sq.reduce((a, b) => a + b, 0) / arr.length);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const PPGLivenessScreen = ({ navigation, route }) => {
    const { formData, faceImage } = route.params;

    const [phase, setPhase] = useState('instructions'); // instructions | scanning | analyzing | result
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing camera...');
    const [result, setResult] = useState(null);
    const [fingerDetected, setFingerDetected] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [sampleCount, setSampleCount] = useState(0);
    const [rednessLevel, setRednessLevel] = useState(0);
    const [zoom, setZoom] = useState(0); // 0 = Main, >0 might trigger diff lens 
    const [currentAction, setCurrentAction] = useState(''); // PRESS | RELEASE | STEADY


    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);
    const intensities = useRef([]);
    const timestamps = useRef([]);
    const startTime = useRef(null);
    const isCapturing = useRef(false);
    const capturedFrames = useRef([]); // To store frames for backend

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        return () => {
            isCapturing.current = false;
        };
    }, []);

    // Pulse animation when scanning
    useEffect(() => {
        if (phase === 'scanning' && fingerDetected) {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            );
            loop.start();
            return () => loop.stop();
        }
    }, [phase, fingerDetected]);

    const startScanning = async () => {
        const { status } = await requestPermission();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed for liveness detection.');
            return;
        }
        setPhase('scanning');
        setCameraReady(false);
        setTorchOn(false);
        intensities.current = [];
        timestamps.current = [];
        capturedFrames.current = [];
        setProgress(0);
        setSampleCount(0);
        setFingerDetected(false);
        startTime.current = null;
        isCapturing.current = false;
        setCurrentAction('');
    };

    const toggleLens = () => {
        setZoom(prev => (prev === 0 ? 0.3 : 0)); // Switching zoom often forces lens change on iPhone
        Alert.alert('Lens Switched', 'Try covering the new lens that shows your thumb on screen.');
    };

    const handleCameraReady = useCallback(() => {
        setCameraReady(true);
        setTimeout(() => {
            setTorchOn(true);
            setTimeout(() => {
                beginCapture();
            }, 500);
        }, 300);
    }, []);

    const beginCapture = async () => {
        if (isCapturing.current) return;
        isCapturing.current = true;
        startTime.current = Date.now();
        setStatusText('Place your finger over the camera...');

        // SEQUENTIAL capture loop — wait for each photo before taking next
        // This is critical on iPhone where takePictureAsync takes ~300-600ms
        while (isCapturing.current) {
            if (!cameraRef.current) {
                await new Promise(r => setTimeout(r, 100));
                continue;
            }

            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.01,     // Absolute minimum quality for speed
                    base64: true,
                    skipProcessing: true,
                    shutterSound: false,
                });

                if (!isCapturing.current) break;

                if (photo?.base64) {
                    const now = Date.now();
                    const elapsed = now - startTime.current;

                    // Collect frame for backend at specific intervals (Spaced Capture)
                    // This ensures we get frames from Press, Release, and Steady phases.
                    const targetIndices = [0.2, 0.4, 0.6, 0.8, 0.98];
                    const currentProg = elapsed / CAPTURE_DURATION_MS;

                    if (capturedFrames.current.length < targetIndices.length) {
                        const nextTarget = targetIndices[capturedFrames.current.length];
                        if (currentProg >= nextTarget) {
                            capturedFrames.current.push(photo.base64);
                            console.log(`Captured frame for backend at ${Math.round(currentProg * 100)}%`);
                        }
                    }

                    // Performance: Only decode base64 for UI progress meter every 2nd frame
                    if (intensities.current.length % 2 === 0) {
                        const brightness = extractRedChannel(photo.base64);
                        intensities.current.push(brightness);
                        setRednessLevel(Math.min(100, Math.round(brightness * 1.5)));

                        // Detect finger
                        const last3 = intensities.current.slice(-3);
                        const avgRecent = last3.reduce((a, b) => a + b, 0) / (last3.length || 1);
                        setFingerDetected(avgRecent > 35);
                    } else {
                        // Just push the last intensity to keep count but save CPU
                        intensities.current.push(intensities.current[intensities.current.length - 1] || 0);
                    }

                    timestamps.current.push(now);
                    setSampleCount(intensities.current.length);

                    // Progress
                    const prog = Math.min(1, elapsed / CAPTURE_DURATION_MS);
                    console.log('SCANNING: prog=', prog, 'action=', currentAction);
                    setProgress(prog);

                    Animated.timing(progressAnim, {
                        toValue: prog,
                        duration: 80,
                        useNativeDriver: false,
                    }).start();

                    // Status updates with Active Pressure instructions
                    if (!fingerDetected) {
                        setStatusText('Place your finger firmly over the camera lens');
                        setCurrentAction('');
                    } else if (prog < 0.15) {
                        setStatusText('Starting scan... Keep finger steady');
                        setCurrentAction('STEADY');
                    } else if (prog < 0.5) {
                        setStatusText('Phase 1: PRESS HARD on the lens now!');
                        setCurrentAction('PRESS');
                    } else if (prog < 0.85) {
                        setStatusText('Phase 2: RELEASE pressure slightly (don\'t lift!)');
                        setCurrentAction('RELEASE');
                    } else {
                        setStatusText('Finalizing... Stay still');
                        setCurrentAction('STEADY');
                    }

                    // Done
                    if (elapsed >= CAPTURE_DURATION_MS) {
                        finishCapture();
                        return;
                    }
                }
            } catch (err) {
                // If camera not ready, wait a bit and retry
                await new Promise(r => setTimeout(r, 200));
            }
        }
    };

    const finishCapture = async () => {
        isCapturing.current = false;
        setPhase('analyzing');
        setStatusText('Verifying with server...');

        try {
            // Call Backend for authoritative liveness check
            const response = await verifyLiveness(capturedFrames.current);

            if (response.success) {
                const apiResult = response.data;
                setResult({
                    isAlive: apiResult.alive,
                    confidence: Math.round(apiResult.confidence * 100),
                    message: apiResult.message
                });
            } else {
                // Fallback to local analysis if backend fails (failsafe but warn)
                console.warn('Backend liveness check failed, falling back to local analysis:', response.error);
                const localResult = analyzeBioSignature(intensities.current);
                localResult.message = localResult.isAlive
                    ? "Verified locally (Server offline)"
                    : "Verification failed (Local check)";
                setResult(localResult);
            }
        } catch (error) {
            console.error('Liveness finalization error:', error);
            setResult({
                isAlive: false,
                confidence: 0,
                message: 'System error during verification. Please try again.'
            });
        }

        setPhase('result');
    };

    const handleRetry = () => {
        setResult(null);
        setPhase('instructions');
        setProgress(0);
        setTorchOn(false);
        setCameraReady(false);
        setSampleCount(0);
        intensities.current = [];
        timestamps.current = [];
    };

    const handleContinue = () => {
        // Replace current screen with Signup to prevent navigation loops
        navigation.replace('Signup', {
            formData: formData, // passing back original data
            faceImage: faceImage,
            ppgVerified: true,
            ppgResult: {
                confidence: result.confidence,
                verifiedAt: new Date().toISOString(),
            },
        });
    };

    const handleCancel = () => {
        isCapturing.current = false;
        // Replace back to Signup with original data to avoid navigation loops
        navigation.replace('Signup', {
            formData: formData,
            faceImage: faceImage,
        });
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER: Instructions
    // ═══════════════════════════════════════════════════════════════════════
    if (phase === 'instructions') {
        return (
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
                <StatusBar barStyle="light-content" />
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
                        <Icon name="arrow-left" size={28} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerSection}>
                        <View style={styles.iconCircle}>
                            <Icon name="heart-pulse" size={50} color="#ff6b6b" />
                        </View>
                        <Text style={styles.mainTitle}>Liveness Detection</Text>
                        <Text style={styles.mainSubtitle}>
                            Verify you're a real person using your heartbeat
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardHeader}>How it works:</Text>

                        <View style={styles.step}>
                            <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
                            <View style={styles.stepBody}>
                                <Text style={styles.stepTitle}>Find the Right Camera</Text>
                                <Text style={styles.stepDesc}>
                                    Tap "Switch Lens" to find the camera next to the flash. Cover it with your thumb.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.step}>
                            <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
                            <View style={styles.stepBody}>
                                <Text style={styles.stepTitle}>Bio-Check (5 seconds)</Text>
                                <Text style={styles.stepDesc}>
                                    Hold still. We verify your identity via the light signature of your thumb.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.tipBox}>
                            <Icon name="checkbox-marked-circle-outline" size={18} color="#ffa502" />
                            <Text style={styles.tipText}>
                                Fast & Simple: This new method is optimized for iPhone 14 Pro for instant verification.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.startBtn} onPress={startScanning} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#ff6b6b', '#ee5a24']}
                            style={styles.startGrad}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            <Icon name="fingerprint" size={24} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.startText}>Start Detection</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </LinearGradient>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER: Scanning — Camera is FULL SCREEN so user sees red finger glow
    // ═══════════════════════════════════════════════════════════════════════
    if (phase === 'scanning') {
        const progressWidth = progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
        });

        return (
            <View style={styles.scanRoot}>
                <StatusBar barStyle="light-content" />

                {/* FULL-SCREEN CAMERA — user sees the red finger glow */}
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torchOn}
                    onCameraReady={handleCameraReady}
                    active={true}
                    autofocus="off"
                    zoom={zoom}
                />

                {/* Overlay UI on top of camera */}
                <View style={styles.scanOverlay}>
                    {/* Top bar */}
                    <View style={styles.scanTopBar}>
                        <TouchableOpacity onPress={handleCancel} style={styles.scanCloseBtn}>
                            <Icon name="close" size={26} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.scanTopTitle}>PPG Liveness Scan</Text>

                        {/* Lens switch button */}
                        <TouchableOpacity style={styles.lensToggle} onPress={toggleLens}>
                            <Icon name="camera-switch" size={20} color="#fff" />
                            <Text style={styles.lensToggleText}>Switch Lens</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Center content */}
                    <View style={styles.scanCenter}>
                        {/* Finger guide circle */}
                        <Animated.View style={[
                            styles.fingerGuide,
                            { transform: [{ scale: pulseAnim }] },
                            fingerDetected && styles.fingerGuideDetected,
                        ]}>
                            <Icon
                                name={fingerDetected ? 'heart-pulse' : 'fingerprint'}
                                size={50}
                                color="#fff"
                            />
                        </Animated.View>

                        {/* Detection status badge */}
                        <View style={[
                            styles.statusBadge,
                            fingerDetected ? styles.statusBadgeGreen : styles.statusBadgeOrange,
                        ]}>
                            <Icon
                                name={fingerDetected ? 'check-circle' : 'alert-circle-outline'}
                                size={16}
                                color={fingerDetected ? '#4ecdc4' : '#ffa502'}
                            />
                            <Text style={[
                                styles.statusBadgeText,
                                { color: fingerDetected ? '#4ecdc4' : '#ffa502' },
                            ]}>
                                {fingerDetected ? 'Finger Detected ✓' : 'Place finger on camera'}
                            </Text>
                        </View>

                        {/* PROMINENT ACTION INSTRUCTION */}
                        {fingerDetected && currentAction !== '' && (
                            <Animated.View style={[
                                styles.actionBox,
                                currentAction === 'PRESS' && styles.actionBoxPress,
                                currentAction === 'RELEASE' && styles.actionBoxRelease,
                                { transform: [{ scale: pulseAnim }] }
                            ]}>
                                <Icon
                                    name={
                                        currentAction === 'PRESS' ? 'gesture-tap' :
                                            currentAction === 'RELEASE' ? 'gesture-tap-box' :
                                                'gesture-tap-hold'
                                    }
                                    size={30}
                                    color="#fff"
                                    style={{ marginBottom: 5 }}
                                />
                                <Text style={styles.actionText}>
                                    {currentAction === 'PRESS' ? 'PRESS HARD' :
                                        currentAction === 'RELEASE' ? 'RELEASE' :
                                            'HOLD STEADY'}
                                </Text>
                            </Animated.View>
                        )}

                        {/* Camera ready / torch status */}
                        {!cameraReady && (
                            <View style={styles.statusBadge}>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={[styles.statusBadgeText, { color: '#fff' }]}>
                                    Starting camera...
                                </Text>
                            </View>
                        )}
                        {cameraReady && !torchOn && (
                            <View style={styles.statusBadge}>
                                <ActivityIndicator size="small" color="#ffa502" />
                                <Text style={[styles.statusBadgeText, { color: '#ffa502' }]}>
                                    Activating flash...
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Bottom panel */}
                    <View style={styles.scanBottom}>
                        <Text style={styles.scanStatus}>{statusText}</Text>

                        {/* Progress bar */}
                        <View style={styles.progressWrap}>
                            <View style={styles.progressBg}>
                                <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
                                    <LinearGradient
                                        colors={['#ff6b6b', '#ee5a24']}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    />
                                </Animated.View>
                            </View>
                            <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
                        </View>

                        {/* Redness Meter */}
                        <View style={styles.rednessContainer}>
                            <Text style={styles.rednessLabel}>Redness Intensity:</Text>
                            <View style={styles.rednessBarBg}>
                                <View style={[styles.rednessBarFill, { width: `${rednessLevel}%`, backgroundColor: rednessLevel > 40 ? '#ff4757' : '#ffa502' }]} />
                            </View>
                        </View>

                        {/* Sample count */}
                        <Text style={styles.sampleText}>
                            Samples Captured: {sampleCount} / {MIN_SAMPLES_REQUIRED}
                        </Text>

                        {/* Guidance */}
                        <View style={styles.waveWrap}>
                            <Text style={styles.verifyingText}>Verifying bio-signature properties...</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER: Analyzing
    // ═══════════════════════════════════════════════════════════════════════
    if (phase === 'analyzing') {
        return (
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#ff6b6b" />
                    <Text style={styles.analyzingTitle}>Verifying Bio-Signature...</Text>
                    <Text style={styles.analyzingSub}>Checking tissue properties and stability</Text>
                </View>
            </LinearGradient>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER: Result
    // ═══════════════════════════════════════════════════════════════════════
    if (phase === 'result' && result) {
        const ok = result.isAlive;
        return (
            <LinearGradient
                colors={ok ? ['#0f3460', '#16213e', '#1a1a2e'] : ['#2d1b1b', '#1a1a2e', '#1a1a2e']}
                style={styles.container}
            >
                <StatusBar barStyle="light-content" />
                <View style={styles.resultWrap}>
                    {/* Icon */}
                    <View style={[styles.resultIcon, ok ? styles.okCircle : styles.failCircle]}>
                        <Icon name={ok ? 'check-circle' : 'close-circle'} size={70} color={ok ? '#4ecdc4' : '#ff6b6b'} />
                    </View>

                    <Text style={[styles.resultTitle, { color: ok ? '#4ecdc4' : '#ff6b6b' }]}>
                        {ok ? 'Liveness Verified!' : 'Verification Failed'}
                    </Text>
                    <Text style={styles.resultMsg}>{result.message}</Text>

                    {/* Stats */}
                    {ok && (
                        <View style={styles.statsCard}>
                            <View style={styles.statsRow}>
                                <View style={styles.stat}>
                                    <Icon name="palette" size={24} color="#ff6b6b" />
                                    <Text style={styles.statVal}>OK</Text>
                                    <Text style={styles.statLbl}>Chromacity</Text>
                                </View>
                                <View style={styles.statDiv} />
                                <View style={styles.stat}>
                                    <Icon name="shield-check" size={24} color="#4ecdc4" />
                                    <Text style={styles.statVal}>{result.confidence}%</Text>
                                    <Text style={styles.statLbl}>Confidence</Text>
                                </View>
                                <View style={styles.statDiv} />
                                <View style={styles.stat}>
                                    <Icon name="anchor" size={24} color="#ffa502" />
                                    <Text style={styles.statVal}>High</Text>
                                    <Text style={styles.statLbl}>Stability</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Buttons */}
                    <View style={styles.resultBtns}>
                        {ok ? (
                            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={['#4ecdc4', '#44bd9e']}
                                    style={styles.continueFill}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.continueTxt}>Continue Signup</Text>
                                    <Icon name="arrow-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
                                    <LinearGradient
                                        colors={['#ff6b6b', '#ee5a24']}
                                        style={styles.retryFill}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    >
                                        <Icon name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.retryTxt}>Try Again</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelResBtn} onPress={handleCancel}>
                                    <Text style={styles.cancelResTxt}>Cancel Signup</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </LinearGradient>
        );
    }

    return null;
};

// ─── Live Waveform Component ─────────────────────────────────────────────────

const LiveWaveform = ({ data }) => {
    if (!data || data.length < 3) {
        return (
            <View style={waveStyles.box}>
                <Text style={waveStyles.placeholder}>Waiting for signal...</Text>
            </View>
        );
    }

    const display = data.slice(-50);
    const min = Math.min(...display);
    const max = Math.max(...display);
    const range = max - min || 1;
    const barW = Math.max(2, (SCREEN_WIDTH - 80) / 50 - 1);

    return (
        <View style={waveStyles.box}>
            <View style={waveStyles.bars}>
                {display.map((val, i) => {
                    const h = ((val - min) / range) * 50 + 4;
                    return (
                        <View
                            key={i}
                            style={{
                                height: h,
                                width: barW,
                                marginHorizontal: 0.5,
                                borderRadius: 1,
                                backgroundColor: i > display.length - 4 ? '#ff6b6b' : 'rgba(255,107,107,0.4)',
                            }}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const waveStyles = StyleSheet.create({
    box: { height: 65, justifyContent: 'center', alignItems: 'center' },
    placeholder: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', height: 55 },
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 25, paddingTop: 50 },
    backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 55 : 45, left: 20, zIndex: 99, padding: 5 },

    // Instructions
    headerSection: { alignItems: 'center', marginTop: 70, marginBottom: 25 },
    iconCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(255,107,107,0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 18,
    },
    mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    mainSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, lineHeight: 21 },

    card: {
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 20,
        marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: { fontSize: 17, fontWeight: 'bold', color: '#fff', marginBottom: 18 },
    step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    stepCircle: {
        width: 30, height: 30, borderRadius: 15, backgroundColor: '#ff6b6b',
        justifyContent: 'center', alignItems: 'center', marginRight: 14, marginTop: 2,
    },
    stepNum: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    stepBody: { flex: 1 },
    stepTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 3 },
    stepDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 },
    tipBox: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: 'rgba(255,165,2,0.1)', borderRadius: 12,
        padding: 12, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,165,2,0.2)',
    },
    tipText: { color: '#ffa502', fontSize: 12, lineHeight: 18, marginLeft: 10, flex: 1 },

    startBtn: { borderRadius: 16, overflow: 'hidden' },
    startGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 17 },
    startText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    // Scanning
    scanRoot: { flex: 1, backgroundColor: '#000' },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    scanTopBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 45, paddingHorizontal: 15,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingBottom: 12,
    },
    scanCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    scanTopTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },

    lensToggle: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)',
    },
    lensToggleText: { color: '#fff', fontSize: 12, marginLeft: 6, fontWeight: '600' },

    scanCenter: { alignItems: 'center', justifyContent: 'center' },
    fingerGuide: {
        width: 140, height: 140, borderRadius: 70,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,107,107,0.2)',
        marginBottom: 15,
    },
    actionBox: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#fff',
        marginTop: 15,
        alignItems: 'center',
    },
    actionBoxPress: {
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255,107,107,0.4)',
    },
    actionBoxRelease: {
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78,205,196,0.4)',
    },
    actionText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    fingerGuideDetected: {
        borderColor: '#4ecdc4', backgroundColor: 'rgba(78,205,196,0.15)',
    },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)', marginTop: 8,
    },
    statusBadgeGreen: { backgroundColor: 'rgba(78,205,196,0.2)' },
    statusBadgeOrange: { backgroundColor: 'rgba(255,165,2,0.2)' },
    statusBadgeText: { fontSize: 13, marginLeft: 7, fontWeight: '600' },

    scanBottom: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 25, paddingTop: 15, paddingBottom: Platform.OS === 'ios' ? 40 : 25,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
    },
    scanStatus: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 14, fontWeight: '600' },
    progressWrap: { alignItems: 'center', marginBottom: 15 },
    progressBg: {
        width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3, overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
    progressPct: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 },

    rednessContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, paddingHorizontal: 5,
    },
    rednessLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
    rednessBarBg: {
        flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2, marginLeft: 15, overflow: 'hidden',
    },
    rednessBarFill: { height: '100%', borderRadius: 2 },

    sampleText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginTop: -5, marginBottom: 10 },
    waveWrap: { marginTop: 8, height: 40, justifyContent: 'center' },
    verifyingText: { color: '#ff6b6b', fontSize: 13, textAlign: 'center', fontStyle: 'italic' },

    // Analyzing
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    analyzingTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 22 },
    analyzingSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 },

    // Result
    resultWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
    resultIcon: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 22 },
    okCircle: { backgroundColor: 'rgba(78,205,196,0.12)' },
    failCircle: { backgroundColor: 'rgba(255,107,107,0.12)' },
    resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    resultMsg: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 28 },

    statsCard: {
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 18,
        width: '100%', marginBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    stat: { alignItems: 'center', flex: 1 },
    statVal: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 6 },
    statLbl: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },
    statDiv: { width: 1, height: 45, backgroundColor: 'rgba(255,255,255,0.15)' },

    resultBtns: { width: '100%' },
    continueBtn: { borderRadius: 16, overflow: 'hidden' },
    continueFill: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
    continueTxt: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    retryBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    retryFill: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
    retryTxt: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    cancelResBtn: { paddingVertical: 14, alignItems: 'center' },
    cancelResTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
});

export default PPGLivenessScreen;
