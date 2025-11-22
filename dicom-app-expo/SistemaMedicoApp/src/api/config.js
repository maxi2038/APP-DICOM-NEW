import axios from 'axios';

// ¡CAMBIA ESTA URL a tu IP local si no estás usando un simulador de iOS!
const API_BASE_URL = 'http:/192.168.100.97:3000/api'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});