
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';
const api = axios.create({
    baseURL: baseURL,
    headers: { 'Content-Type':'application/json'}
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access');
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error)=> Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
            return Promise.reject(error);
        }
        const originalRequest = error.config;
        if(error.response.status === 401 && !originalRequest._retry){
            originalRequest._retry = true;
        try{
            const refreshToken = localStorage.getItem('refresh');
            const response = await axios.post(`${baseURL}token/refresh/`,{
                refresh: refreshToken
            });

            localStorage.setItem('access',response.data.access);
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;    
            return api(originalRequest);

        }catch{
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
}
);

export default api;