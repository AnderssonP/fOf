const os = require('os');

module.exports = {
    address: () => {
        const intfs = os.networkInterfaces();

        for (const aa of Object.values(intfs)) {
            for (const a of aa) {
                if (!a.internal && a.family.toLowerCase() === 'ipv4') {
                    return a.address;
                }
            }
        }
        return '127.0.0.1';
    }
}