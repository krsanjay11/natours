/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url = `http://127.0.0.1:3000/api/v1/users/${type === 'password' ? 'updateMyPassword' : 'updateMe'}`;
    console.log(url, data);
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    console.log('user successful updated');
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

// export const updateData = async (name, email) => {
//   try {
//     const res = await axios({
//       method: 'PATCH',
//       url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
//       data: {
//         name,
//         email,
//       },
//     });

//     if (res.data.status === 'success') {
//       showAlert('success', 'Data updated successfully!');
//     }
//   } catch (err) {
//     showAlert('error', err.response.data.message);
//   }
// };
