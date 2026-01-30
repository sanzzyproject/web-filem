const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class Viu {
    constructor() {
        this.inst = axios.create({
            baseURL: 'https://api-gateway-global.viu.com/api',
            headers: {
                'accept-encoding': 'gzip',
                'content-type': 'application/x-www-form-urlencoded',
                'x-platform': 'android',
                'user-agent': 'okhttp/4.12.0'
            }
        });
        this.token = null;
    }
    
    getToken = async function () {
        if(this.token) return this.token;
        try {
            const { data } = await this.inst.post('/auth/token', {
                countryCode: 'ID',
                platform: 'android',
                platformFlagLabel: 'phone',
                language: '8',
                deviceId: uuidv4(),
                dataTrackingDeviceId: uuidv4(),
                osVersion: '30',
                appVersion: '2.21.0',
                deviceBrand: 'samsung',
                deviceModel: 'SM-G991B',
            });
            this.token = data.token;
            this.inst.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            return data.token;
        } catch (error) {
            throw new Error("Gagal Auth Token");
        }
    }
    
    home = async function () {
        try {
            await this.getToken();
            const { data } = await this.inst.get('/mobile', { params: { r: '/home/index', platform_flag_label: 'phone', area_id: '1000', countryCode: 'ID' }});
            return data.data;
        } catch (error) { throw new Error(error.message); }
    }
    
    search = async function (query) {
        try {
            await this.getToken();
            const { data } = await this.inst.get('/mobile', { params: { r: '/search/video', limit: '20', 'keyword[]': query, platform_flag_label: 'phone', area_id: '1000', countryCode: 'ID' }});
            return data.data;
        } catch (error) { throw new Error(error.message); }
    }
    
    detail = async function (productId) {
        try {
            await this.getToken();
            const { data } = await this.inst.get('/mobile', { params: { r: '/vod/detail', product_id: productId, platform_flag_label: 'phone', area_id: '1000', countryCode: 'ID' }});
            let seriesId = data.data.series ? data.data.series.series_id : null;
            let productList = [];
            if(seriesId) {
                 const { data: ep } = await this.inst.get('/mobile', { params: { r: '/vod/product-list', product_id: productId, series_id: seriesId, platform_flag_label: 'phone', size: '-1', sort: 'asc', area_id: '1000', countryCode: 'ID' }});
                productList = ep.data.product_list;
            } else { productList = [data.data.current_product]; }
            return { metadata: data.data, product_list: productList };
        } catch (error) { throw new Error(error.message); }
    }
    
    stream = async function (ccsProductId) {
        try {
            await this.getToken();
            const { data } = await this.inst.get('/playback/distribute', { params: { ccs_product_id: ccsProductId, platform_flag_label: 'phone', area_id: '1000', countryCode: 'ID' }});
            return data.data;
        } catch (error) { throw new Error(error.message); }
    }
}
module.exports = Viu;
