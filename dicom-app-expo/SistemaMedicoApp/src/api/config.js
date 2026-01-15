import axios from 'axios';

const API_BASE_URL = 'http://dicombackend.us-east-2.elasticbeanstalk.com/api'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});