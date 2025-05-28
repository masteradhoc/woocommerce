<?php

namespace Automattic\WooCommerce\Woodcraft\Cli;

use Symfony\Component\Console\Command\Command;
use Automattic\WooCommerce\Woodcraft\Config;
use Automattic\WooCommerce\Woodcraft\Github\ApiClient as GithubApiClient;

class CommandBase extends Command {

    public function __construct(protected ?Config $config = null, protected ?GithubApiClient $github_api_client = null) {
        parent::__construct();

        $this->config = $config ?? new Config();
        $this->github_api_client ??= new GithubApiClient(config: $config);
    }
}