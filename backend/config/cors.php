<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://onepathlab.localhost:3000',
        'http://lis.onepathlab.localhost:3001',
        'http://admin.onepathlab.localhost:3002',
        'https://onepathlab.com',
        'https://lis.onepathlab.com',
        'https://admin.onepathlab.com',
        'http://192.168.31.192:3000',
        'http://192.168.31.192:3001',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];