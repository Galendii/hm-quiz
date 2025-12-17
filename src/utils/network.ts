export const getPublicIP = async (): Promise<string | null> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) return null;
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn('Failed to fetch IP:', error);
        return null;
    }
};
