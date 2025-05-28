<?php

namespace Automattic\WooCommerce\Woodcraft;

use Automattic\WooCommerce\Woodcraft\AppException;

class HttpClient {
    public function http_request(string $url, array $headers = [], $content = null, ?string $verb = null): string {
        $options = array(
            'http' => array(
                'header'  => array_merge(['User-agent: Woodcraft'], $headers),
                'method'  => $verb ?? ($content ? 'POST' : 'GET'),
                'ignore_errors' => true,
            )
        );

        if(is_array($content)) {
            $options['http']['content'] = json_encode($content);
            $options['http']['header'][] = 'Content-type: application/json\r\n';
        }
        elseif($content) {
            $options['http']['content'] = $content;
        };

        $context = stream_context_create($options);
        return file_get_contents($url, false, $context);
        if ($result === false) { 
            throw new AppException("HTTP request failed");
        }

        $status_line = $http_response_header[0];
        preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
        $status = $match[1];
        if($status[0] !== '2') {
            throw new AppException("HTTP request failed: {$status_line}\n");
        }

        return $result;
    }
}