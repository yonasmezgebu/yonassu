exports.savePushSubscription = async (req, res) => {
  const { userId, subscription } = req.body;
  if (!userId || !subscription) return res.status(400).json({ error: 'Missing data' });
  
  try {
    const existing = await db('push_subscriptions').where({
      user_id: userId,
      endpoint: subscription.endpoint
    }).first();

    if (!existing) {
      await db('push_subscriptions').insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth
      });
    }
    res.json({ message: 'Subscription saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
