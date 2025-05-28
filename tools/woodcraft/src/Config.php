<?php

namespace Automattic\WooCommerce\Woodcraft;

use Automattic\WooCommerce\Woodcraft\AppException;

class Config {
    private $config;

    public string $github_key = '' {
        get {
            if ($this->github_key === '') {
                $key = getenv('GITHUB_KEY');
                if($key === false) {
                    $key = $this->config['github']['api_key'] ?? false;
                }

                if(!is_string($key) || $key === '') {
                    throw new AppException("Github API key not present in the config.json file and not supplied in a GITHUB_KEY variable.");
                }

                $this->github_key = $key;
            }
            return $this->github_key;
        }
    }

    public string $repo_owner = '' {
        get {
            if ($this->repo_owner === '') {
                $this->repo_owner = $this->config['github']['repo_owner'] ?? false;

                if(!is_string($this->repo_owner) || $this->repo_owner === '') {
                    throw new AppException("Github repository owner not present in the config.json file.");
                }
            }
            return $this->repo_owner;
        }
    }

    public string $repo_name = '' {
        get {
            if ($this->repo_name === '') {
                $this->repo_name = $this->config['github']['repo_name'] ?? false;

                if(!is_string($this->repo_name) || $this->repo_name === '') {
                    throw new AppException("Github repository name not present in the config.json file.");
                }
            }
            return $this->repo_name;
        }
    }

    public function __construct(?string $filename = null) {
        $filename ??= __DIR__ . '/../config.json';
        if(!file_exists($filename)) {
            throw new AppException("config.json file not found. Create one by making a copy of config.json.example and modifying it appropriately.");
        }

        $config_file_contents = file_get_contents($filename);
        if($config_file_contents === false) {
            throw new AppException("Error reading config.json file.");
        }

        $this->config = json_decode($config_file_contents, true);
        if(!is_array($this->config)) {
            throw new AppException("Error processing config.json file: it doesn't represent a valid JSON object.");
        }
    }
}