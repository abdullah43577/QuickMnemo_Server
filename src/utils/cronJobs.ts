import cron from 'node-cron';
import User from '../models/users.model';

export const runJob = function () {
  cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date();

      // Find users whose subscription period has ended and who have cancelled
      const usersToDowngrade = await User.find({
        'subscription.status': 'cancelled',
        'subscription.nextPaymentDate': {
          $lte: today,
        },
      });

      // Downgrade each user
      for (const user of usersToDowngrade) {
        user.isPremium = false;
        await user.save();
        // Optionally, notify the user about the downgrade
      }

      console.log(`Downgraded ${usersToDowngrade.length} users.`);
    } catch (error) {
      console.error('Error running the downgrade cron job:', error);
    }
  });
};
