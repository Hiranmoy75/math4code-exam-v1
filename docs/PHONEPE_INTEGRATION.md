# PhonePe Payment Integration

This application integrates PhonePe Payment Gateway for test series purchases.

## Setup Instructions

### 1. Get PhonePe Credentials

1. Sign up at [PhonePe Business](https://business.phonepe.com/)
2. Complete merchant onboarding
3. Get your credentials from the dashboard:
   - Merchant ID
   - Salt Key
   - Salt Index

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# PhonePe Configuration
PHONEPE_MERCHANT_ID=your_merchant_id_here
PHONEPE_SALT_KEY=your_salt_key_here
PHONEPE_SALT_INDEX=1
PHONEPE_API_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** 
- For production, use: `https://api.phonepe.com/apis/hermes`
- For testing/sandbox, use: `https://api-preprod.phonepe.com/apis/pg-sandbox`

### 3. Payment Flow

1. **Student browses test series** → `/student/all-test-series`
2. **Clicks "Buy" button** → Initiates payment via `/api/payments/initiate`
3. **Redirected to PhonePe** → Student completes payment
4. **PhonePe callback** → `/api/payments/callback` verifies payment
5. **Success/Failure page** → `/student/payment/success`
6. **Auto-enrollment** → Student enrolled in test series on success

### 4. API Routes

- **POST** `/api/payments/initiate` - Initiates payment with PhonePe
- **POST** `/api/payments/callback` - Handles PhonePe callback

### 5. Database Tables Used

- `payments` - Stores payment records
- `test_series_enrollments` - Stores student enrollments
- `test_series` - Test series information

### 6. Testing

For testing in sandbox mode:
1. Use PhonePe sandbox credentials
2. Use test card numbers provided by PhonePe
3. Monitor payment status in PhonePe dashboard

### 7. Security Features

- ✅ Checksum verification for all requests
- ✅ User authentication required
- ✅ Duplicate enrollment prevention
- ✅ Payment status verification
- ✅ Secure callback handling

### 8. Error Handling

The integration handles:
- Invalid credentials
- Network failures
- Duplicate payments
- Failed transactions
- Callback verification failures

## Support

For PhonePe integration issues, contact PhonePe support or refer to their [official documentation](https://developer.phonepe.com/docs).
