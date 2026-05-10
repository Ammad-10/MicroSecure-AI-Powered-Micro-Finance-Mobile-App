import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BillPaymentScreen from './src/screens/BillPaymentScreen';
import SendMoneyScreen from './src/screens/SendMoneyScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import TransferReceiptScreen from './src/screens/TransferReceiptScreen';
import PPGLivenessScreen from './src/screens/PPGLivenessScreen';
import DuressAlertScreen from './src/screens/DuressAlertScreen';

const Stack = createStackNavigator();

import { registerRootComponent } from 'expo';

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Welcome"
                screenOptions={{
                    headerShown: false,
                    cardStyleInterpolator: ({ current: { progress } }) => ({
                        cardStyle: {
                            opacity: progress,
                        },
                    }),
                }}
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="BillPayment" component={BillPaymentScreen} />
                <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
                <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                <Stack.Screen name="TransferReceipt" component={TransferReceiptScreen} />
                <Stack.Screen name="PPGLiveness" component={PPGLivenessScreen} />
                <Stack.Screen name="DuressAlert" component={DuressAlertScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

registerRootComponent(App);

export default App;
