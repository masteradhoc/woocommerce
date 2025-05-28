<?php

define('APP_VERSION', '1.0.34');

if (version_compare(PHP_VERSION, '8.4', '<')) {
    echo '*** This tool requires PHP 8.4 or higher, you are using PHP ' . PHP_VERSION . ".\n";
    exit(1);
}

require __DIR__.'/vendor/autoload.php';

(new \Automattic\WooCommerce\Woodcraft\App())->run();

exit(0);
