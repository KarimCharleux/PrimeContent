module.exports = {
    apps: [
        {
            name: 'dalifilms',
            script: 'npm',
            args: 'start',
            cwd: '/var/www/PrimeContent',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: '/var/log/pm2/dalifilms-error.log',
            out_file: '/var/log/pm2/dalifilms-out.log',
            log_file: '/var/log/pm2/dalifilms.log',
        },
    ],
};
