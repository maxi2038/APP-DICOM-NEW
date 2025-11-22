import axios from 'axios';

// ¡CAMBIA ESTA URL a tu IP local si no estás usando un simulador de iOS!
const API_BASE_URL = 'https://api-dicom-movil.onrender.com/api'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});