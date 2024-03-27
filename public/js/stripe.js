/* eslint-disable no-undef */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const stripe = Stripe(
      'pk_test_51OyZwkSAABYxW4ahSLCSNNCI1m6vOFSWGEfbBJzSs0FLUNpub8Mf5ct0Rqedv8riOrrSu2hBcELkpXrvmSnUQeUI0096fUKkri',
    );
    const session = await axios(
      // `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
      `/api/v1/bookings/checkout-session/${tourId}`,
    );
    // console.log(session); // {data: {…}, status: 200, statusText: 'OK', headers: AxiosHeaders, config: {…}, …}
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log('🔴🔻', err);
    showAlert('error', err);
  }
};
