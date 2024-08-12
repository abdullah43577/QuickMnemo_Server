import cron from 'node-cron';
import User from '../models/users.model';
import axios from 'axios';

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

export const pingServer = function () {
  cron.schedule('*/10 * * * *', async () => {
    try {
      // Ping your server's /ping endpoint
      const response = await axios.get('https://quickmnemo-server.onrender.com/auth/');
      console.log(`Pinged server: ${response.data}`);
    } catch (error) {
      console.error('Error pinging the server:', error);
    }
  });
};
