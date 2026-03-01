export const hapticFeedback = (duration: number = 10) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
            navigator.vibrate(duration);
        } catch (e) {
            // Silently fail if vibration is blocked or not supported
        }
    }
};

export const hapticSuccess = () => hapticFeedback(12);
export const hapticSoft = () => hapticFeedback(5);
