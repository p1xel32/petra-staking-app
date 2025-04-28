export default async function handler(req, res) {
  try {
    const response = await fetch('https://fullnode.mainnet.aptoslabs.com/v1/validators?limit=100', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching validator info:', error);
    res.status(500).json({ error: 'Failed to fetch validator info' });
  }
}
