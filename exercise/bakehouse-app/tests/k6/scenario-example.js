import http from 'k6/http';
import { group, check, sleep } from 'k6';

const BASE_URL = 'https://jj-oluwasere-bakehouse.cta-training.academy/';

export const options = {
    scenarios: {
        bounce: {
            exec: 'homeJourney',
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 2 },
                { duration: '570s', target: 2 },
            ],
            gracefulRampDown: '5s',
        },
        products: {
            exec: 'productsJourney',
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 1 },
                { duration: '570s', target: 1 },
            ],
            gracefulRampDown: '5s',
        },
        customers: {
            exec: 'customerJourney',
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 1 },
                { duration: '570s', target: 1 },
            ],
            gracefulRampDown: '5s',
        },


        addProducts: {
            exec: 'addProductsJourney',
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 55,
            maxDuration: '6m'
        },

        addCustomers: {
            exec: 'addCustomersJourney',
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 55,
            maxDuration: '6m'
        },

        addOrders: {
            exec: 'addOrdersJourney',
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 55,
            startTime: '6m10s',
            maxDuration: '6m'
        },

    },

    thresholds: {
        http_req_duration: ['p(95)<250', 'max<2000'],
        http_req_failed: ['rate<0.1'],
    },
};

export function homeJourney() {
    group('home journey', () => {
        simpleGetRequest(BASE_URL, '<div id="root"></div>');
        sleep(5);
    });
}

export function productsJourney() {
    group('products journey', () => {
        simpleGetRequest(BASE_URL);
        sleep(5);
        simpleGetRequest(`${BASE_URL}api/products`, 'victoria_sponge_slice');
        sleep(5);
    });
}

export function customerJourney() {
    group('customer journey', () => {
        simpleGetRequest(BASE_URL);
        sleep(5);
        simpleGetRequest(`${BASE_URL}api/customers`, 'Alice Baker');

        sleep(1);
    });
}


export function addProductsJourney() {
    group('add products journey', () => {
        const uniqueId = `${RUN_ID}-${__VU}-${__ITER}`;

        simplePostRequest(`${BASE_URL}api/products`, {
            productId: `product-${uniqueId}`,
            name: ` M&S Cheese Infused Chicken ${uniqueId}`,
            price: 142.99,
        });

        sleep(1);
    });
}

export function addCustomersJourney() {
    group('add customers journey', () => {
        const uniqueId = `${RUN_ID}-${__VU}-${__ITER}`;


        simplePostRequest(`${BASE_URL}api/customers`, {
            customerId: `barry-${uniqueId}`,
            name: `MrBarry ${uniqueId}`,
            email: `TestBarry-${uniqueId}@test.com`,
        });

        sleep(1);
    });
}


export function addOrdersJourney() {
    group('add orders journey', () => {
        const uniqueId = `${RUN_ID}-${__VU}-${__ITER}`;


        simplePostRequest(`${BASE_URL}api/orders`, {
            customerId: `barry-${uniqueId}`,
            items: [
                {
                    productId: `barry-${uniqueId}`,
                    quantity: 14,
                }
            ],
        });

        sleep(1);
    });
}



function simplePostRequest(url, payload) {
    const res = http.post(
        url,
        JSON.stringify(payload),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    const success = check(res, {
        'status was successful': (r) =>
            r.status === 200 || r.status === 201,
    });

    if (!success) {
        console.log(`\nFAILED POST REQUEST: ${url}`);
        console.log(`Status: ${res.status}`);
        console.log(`Response body: ${res.body}`);
    }

    return res;
}




function simpleGetRequest(pageUrl, expectedText = null) {
    const res = http.get(pageUrl);
    sleep(1);
    const success = check(res, {
        'status was 200': (r) => r.status === 200,
        ...(expectedText && {
            'page contains expected text': (r) =>
                r.body.includes(expectedText),
        }),
    });

    if (!success) {
        console.log(`\nFAILED REQUEST: ${pageUrl}`);
        console.log(`Status: ${res.status}`);

        if (expectedText) {
            console.log(`Expected text: ${expectedText}`);
            console.log(`Response body: ${res.body.substring(0, 500)}`);
        }
    }

    return res;
}