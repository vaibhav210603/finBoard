// API route to test environment variables
export default function handler(req, res) {
  const envVars = {
    alphaVantageKey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY,
    alphaVantageUrl: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_BASE_URL,
    finnhubKey: process.env.NEXT_PUBLIC_FINNHUB_API_KEY,
    finnhubUrl: process.env.NEXT_PUBLIC_FINNHUB_BASE_URL,
    allEnvVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
  };

  res.status(200).json(envVars);
}
