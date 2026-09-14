import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Expo Go/dev builds expose the Metro dev server's address here - it's the
// same host the phone or emulator already uses to load the JS bundle, so it
// works for a physical device on the LAN as well as emulators/simulators,
// unlike a hardcoded IP (e.g. "localhost" only resolves on the device
// itself, and 10.0.2.2 only exists inside the Android emulator).
const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? undefined;
const devHost = debuggerHost?.split(":")[0];

const baseURL = devHost
    ? `http://${devHost}:8080`
    : Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080";

console.log("API baseURL:", baseURL);

export const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});