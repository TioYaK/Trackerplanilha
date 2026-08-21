import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.AURORIA_BASE_URL || 'https://auroriaglobal.com';

// Configuração do Axios com User-Agent para evitar bloqueios simples
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  },
  timeout: 10000,
});

export const fetchPage = async (path) => {
  try {
    const response = await api.get(path);
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`Erro ao fazer scraper na rota ${path}:`, error.message);
    throw error;
  }
};
