#!/usr/bin/env bash

ENABLE_HPOS="${ENABLE_HPOS:-0}"
ENABLE_TRACKING="${ENABLE_TRACKING:-0}"

echo -e 'Activate twentynineteen theme \n'
wp-env run tests-cli wp theme activate twentynineteen

echo -e 'Update URL structure \n'
wp-env run tests-cli wp rewrite structure '/%postname%/' --hard

echo -e 'Activate Filter Setter utility plugin \n'
wp-env run tests-cli wp plugin activate filter-setter

echo -e 'Activate Enable Experimental Features utility plugin \n'
wp-env run tests-cli wp plugin activate enable-experimental-features

echo -e 'Add Customer user \n'
wp-env run tests-cli wp user create customer customer@woocommercecoree2etestsuite.com \
	--user_pass=password \
	--role=subscriber \
	--first_name='Jane' \
	--last_name='Smith' \
	--user_registered='2022-01-01 12:23:45'

echo -e 'Update Blog Name \n'
wp-env run tests-cli wp option update blogname 'WooCommerce Core E2E Test Suite'

echo -e 'Preparing Test Files \n'
wp-env run tests-cli sudo cp /var/www/html/wp-content/plugins/woocommerce/tests/legacy/unit-tests/importer/sample.csv /var/www/sample.csv

if [ $ENABLE_HPOS == 1 ]; then
	echo -e 'Enable High-Performance Order Tables\n'
	wp-env run tests-cli wp option update woocommerce_feature_custom_order_tables_enabled 'yes'
	wp-env run tests-cli wp option update woocommerce_custom_orders_table_enabled 'yes'
fi

if [ $ENABLE_TRACKING == 1 ]; then
	echo -e 'Enable tracking\n'
	wp-env run tests-cli wp option update woocommerce_allow_tracking 'yes'
fi
