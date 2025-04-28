export default async function handler(req, res) {
  try {
    const fetchResponse = await fetch('https://fullnode.mainnet.aptoslabs.com/v1/validators?limit=100', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!fetchResponse.ok) {
      console.error('Failed to fetch from Aptos API', fetchResponse.statusText);
      return res.status(500).json({ error: 'Failed to fetch from Aptos API' });
    }

    const data = await fetchResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Server error in get-validator:', error);
    res.status(500).json({ error: 'Server error in get-validator' });
  }
}

