import axios from 'axios'
const authToken = localStorage.getItem('authToken');

if (authToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
}

const csrfToken = document.querySelector('[name=csrf-token]').content;

axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
// You can add other Axios default settings here as well

export default axios;