Here’s the complete documentation formatted as a `README.md` file. You can copy and paste this into your repository:

# **Telegram Bot - README**

## **Overview**
This is a Telegram bot built using Node.js and the `node-telegram-bot-api` library. The bot integrates with a backend API (CopperX) to provide functionalities such as wallet management, fund transfers, transaction history, payee management, and real-time deposit notifications via Pusher. It also uses MongoDB for session management and Express for handling webhooks.

### **Session Management with Encrypted Storage**  

This project uses **MongoDB** to manage user sessions securely. All sensitive session data, including **access tokens**, is encrypted using **AES-256-CBC** before being stored in the database.  

#### **Encryption Process**  
- The encryption key is derived from an environment variable (`ENCRYPTION_KEY`) using **SHA-256 hashing**.  
- **AES-256-CBC** is used to encrypt the access token, ensuring data security.  
- Each session record includes a unique **initialization vector (IV)** to maintain encryption integrity.  

#### **Session Storage Schema**  
Sessions are stored in MongoDB using the following schema:  
```javascript
const sessionSchema = new mongoose.Schema({
  chatId: String,
  userId: String,
  accessToken: String,
  iv: String,
  data: Object,
  expiresAt: String,
});
```
  
#### **Session Handling Functions**  
The session management module provides the following functions:  
- **`get(chatId)`** → Retrieves and decrypts the session data if it is still valid.  
- **`set(chatId, userId, accessToken, data, expiresAt)`** → Encrypts the access token and stores the session.  
- **`delete(chatId)`** → Deletes the session when it expires or is no longer needed.  

#### **Environment Variables**  
Ensure you have the `ENCRYPTION_KEY` set in your **.env** file:  
```env
ENCRYPTION_KEY=your-secure-key
```
Without this key, session management will **not function properly**.  

This approach ensures that **sensitive user data remains encrypted and protected** even if the database is compromised. 🚀

### **Key Features**
- **Wallet Management**: View wallets, check balances, and set a default wallet.
- **Fund Transfers**: Transfer funds via email, wallet, or bank withdrawal.
- **Transaction History**: View past transactions.
- **Payee Management**: Add, edit, or delete payees.
- **Real-Time Notifications**: Receive real-time deposit alerts using Pusher.
- **User Authentication**: Login via email and OTP.
- **Session Management**: Securely manage user sessions with MongoDB.

## **Technologies Used**
- **Node.js**: Runtime environment for the bot.
- **Express.js**: Web framework for handling webhooks.
- **Telegram Bot API**: Interact with Telegram users via the `node-telegram-bot-api` library.
- **MongoDB**: Database for session management.
- **Pusher**: Real-time notifications for deposit alerts.
- **CopperX API**: Backend API for wallet, transaction, and user management.
- **dotenv**: Environment variable management.

## **Setup Instructions**

### **Prerequisites**
1. Node.js (v16 or higher) installed.
2. MongoDB instance running.
3. Telegram Bot Token from [BotFather](https://core.telegram.org/bots#botfather).
4. CopperX API credentials.
5. Pusher credentials (key and cluster).

### **Steps**
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and add the following variables:
   ```env
   BOT_TOKEN=<your-telegram-bot-token>
   MONGO_URI=<your-mongodb-connection-string>
   COPPERX_API=<copperx-api-endpoint>
   COPPERX_API_KEY=<copperx-api-key>
   PUSHER_KEY=<pusher-key>
   PUSHER_CLUSTER=<pusher-cluster>
   WEBHOOK_URL=<your-webhook-url>
   PORT=<port-number> # Optional, defaults to 3000
   ENCRYPTION_KEY=<your-secure-key>
   ```

4. **Run the Bot**:
   ```bash
   npm start
   ```

**5. Set Up Webhook (Optional)**:  
   If using webhooks, ensure your server is accessible via HTTPS. You can use **ngrok** to expose your local server:  
   1. Install ngrok (if not already installed) from [ngrok.com](https://ngrok.com/download).  
   2. Run the following command to expose your server (replace `PORT` with your actual port number):  
      ```sh
      ngrok http PORT
      ```  
   3. Copy the **Forwarding URL** (e.g., `https://your-ngrok-url.ngrok.io`).  
   4. Set the `WEBHOOK_URL` in your `.env` file using this URL:  
      ```env
      WEBHOOK_URL=https://your-ngrok-url.ngrok.io
      ```  
   5. Restart your server and verify the webhook connection.  

## **API Integration Details**

### **CopperX API**
- **Base URL**: `COPPERX_API`
- **Authentication**:  
  - **Method**: Bearer Token  
  - **Header**: `Authorization: Bearer {COPPERX_API_KEY}`  
  - **Content-Type**: `application/json`  

### **Endpoints**  

#### **Authentication**  
- `POST /api/auth/email-otp/request` → Request OTP for login.  
- `POST /api/auth/email-otp/authenticate` → Authenticate with OTP.  

#### **Wallet Management**  
- `GET /api/wallets` → Retrieve all wallets.  
- `GET /api/wallets/balances` → Get wallet balances.  
- `POST /api/wallets/default` → Set default wallet.  

#### **Fund Transfers**  
- `POST /api/transfer/send` → Send a transfer.  
- `POST /api/transfer/wallet-withdraw` → Withdraw funds to a wallet.  
- `POST /api/transfer/offramp` → Withdraw funds via offramp.  
- `POST /api/transfer/send-batch` → Perform batch transfers.  
- `GET /api/quotes/offramp?page=1&limit=10` → Get offramp quotes.  

#### **Transaction History**  
- `GET /api/transfers?page=1&limit=5` → Get transaction history.  

#### **Payee Management**  
- `GET /api/payees` → Retrieve all payees.  
- `POST /api/payees` → Add a new payee.  
- `PUT /api/payees/${payeeId}` → Edit a payee.  
- `DELETE /api/payees/${payeeId}` → Delete a payee.  

#### **Transfer Schedules**  
- `GET /api/transfer-schedules` → Get all transfer schedules.  
- `POST /api/transfer-schedules/${scheduleId}/deactivate` → Deactivate a scheduled transfer.  

#### **User Profile & Points**  
- `GET /api/kycs` → Check KYC status.  
- `GET /auth/me` → Get authenticated user profile.  
- `GET /api/points/total` → Retrieve total reward points.  
- `GET /api/accounts` → Fetch account details.  

#### **Real-Time Notifications**  
- `POST /api/notifications/auth` → Authenticate Pusher channel for notifications.  

### **Pusher Integration**
- **Key**: `PUSHER_KEY`
- **Cluster**: `PUSHER_CLUSTER`
- **Channels**: Subscribes to `private-org-<organizationId>` for deposit notifications.

## **Command Reference**

### **Telegram Commands**
- `/start`: Start the bot and show the main menu.
- `/menu`: Display the main menu.
- `/wallet`: Access wallet management options.
- `/transfer`: Initiate fund transfers.
- `/account`: Manage account settings.
- `/help`: Get help and support.
- `/logout`: Log out of the current session.

### **Callback Query Actions**  

#### **Wallet Management**  
- `view_wallets` → View all wallets.  
- `check_balances` → Check wallet balances.  
- `set_default_wallet` → Set a default wallet (`set_wallet_<walletId>`).  

#### **Fund Transfers**  
- `transfer_email` → Transfer funds via email.  
- `transfer_wallet` → Transfer funds to another wallet.  
- `transfer_bank` → Withdraw funds to a bank account.  
- `transfer_bulk` → Perform bulk transfers.  
- `transfer_list` → View a list of transfers.  

#### **Bank Account Management**  
- `view_bank_account` → View linked bank accounts.  

#### **Transaction & History**  
- `transaction_history` → View transaction history.  

#### **Transfer Schedules**  
- `transfer_schedules` → Manage transfer schedules.  
- `view_schedules` → View all scheduled transfers.  
- `create_schedule` → Create a new transfer schedule (`CREATE_SCHEDULE_<payeeId>`).  
- `deactivate_schedule` → Deactivate a scheduled transfer (`DEACTIVATE_SCHEDULE_<scheduleId>`).  
- `confirm_deactivate_schedule` → Confirm deactivation of a scheduled transfer (`CONFIRM_DEACTIVATE_SCHEDULE_<scheduleId>`).  

#### **Payee Management**  
- `payees` → Open the payee management menu.  
- `add_payee` → Add a new payee.  
- `view_payees` → View all payees.  
- `edit_payee` → Edit an existing payee (`EDIT_PAYEE_<payeeId>`).  
- `delete_payee` → Delete a payee (`DELETE_PAYEE_<payeeId>`).  
- `confirm_delete` → Confirm payee deletion (`CONFIRM_DELETE_<payeeId>`).  

#### **User Profile & Settings**  
- `view_profile` → View user profile details.  
- `check_kyc` → Check KYC status.  
- `points` → View reward points.  

#### **Real-Time Notifications**  
- Subscribes to **deposit notifications** via Pusher.  

#### **Main Menu & Navigation**  
- `main_menu` → Return to the main menu.  
- `wallet` → Open the wallet menu.  
- `account` → Open account settings.  
- `funds_transfer` → Open fund transfer options.  

#### **Help & Logout**  
- `help` → Access help and support options.  
- `logout` → Securely log out and close the session.

## **Troubleshooting Guide**

### **Common Issues**
1. **Bot Not Responding**:
   - Ensure the bot token is correct and the bot is running.
   - Check if the webhook URL is correctly set (if using webhooks).

2. **MongoDB Connection Error**:
   - Verify the `MONGO_URI` in the `.env` file.
   - Ensure MongoDB is running and accessible.

3. **Pusher Notifications Not Working**:
   - Check if the Pusher key and cluster are correct.
   - Ensure the CopperX API is correctly authenticating Pusher channels.

4. **OTP Authentication Failure**:
   - Verify the email and OTP entered.
   - Ensure the CopperX API is reachable and responding.

5. **Webhook Errors**:
   - Ensure the server is accessible via HTTPS.
   - Check the webhook URL and port configuration.

### **Debugging Tips**
- Check the console logs for errors.
- Use tools like Postman to test API endpoints.
- Verify environment variables are correctly set.

## **License**
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## **Contributing**
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## **Support**
For support or questions, please contact the maintainer or open an issue in the repository.
