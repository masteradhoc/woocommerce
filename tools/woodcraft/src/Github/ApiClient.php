<?php

namespace Automattic\WooCommerce\Woodcraft\Github;

use Automattic\WooCommerce\Woodcraft\HttpClient;
use Automattic\WooCommerce\Woodcraft\Config;
use Automattic\WooCommerce\Woodcraft\AppException;

class ApiClient
{
    public function __construct(private ?HttpClient $http_client = null, private ?Config $config = null) {
        $this->http_client ??= new HttpClient();
        $this->config ??= new Config();

        $this->github_key = $config->github_key;
    }

    public function get_open_milestones(): array {

        $owner = $this->config->repo_owner;
        $name = $this->config->repo_name;
        $query = <<<MSX
query {
  repository(owner: "{$owner}", name: "{$name}") {
    milestones(first: 100, states: OPEN) {
      nodes {
        id
        title
        description
        dueOn
      }
    }
  }
}
MSX;
        $result = $this->do_graphql($query);
        return $result['data']['repository']['milestones']['nodes'];
    }

    private function do_graphql(string $query, array $variables = null)
    {
        global $github_key;

        $data = ['query' => $query];
        if ($variables !== null) {
            $data['variables'] = $variables;
        }

        $result = $this->http_client->http_request(
            'https://api.github.com/graphql', 
            ["Authorization: bearer " . $this->config->github_key, "Connection: close"], 
            $data);
        $result = json_decode($result, true);

        if (is_string($result)) {
            throw new AppException("Unexpected response from Github GraphQL API: {$result}");
        }

        if (isset($result['errors'])) {
            throw new AppException("Error returned by Github GraphQL API: {$result['errors'][0]['message']}");
        }

        return $result;
    }

    private function do_rest(string $query, $content = null, ?string $verb = null, array $headers = [], bool $expect_array = true): mixed
    {
        $headers = array_merge($headers, ["Authorization: bearer " . $this->config->github_key, "Connection: close"]);

        $result = $this->http_client->http_request("https://api.github.com/{$query}", $headers, $content, $verb);
        if($expect_array) {
            $result = json_decode($result, true);
        }

        if ($expect_array && !is_array($result)) {
            throw new AppException("Unexpected response from Github REST API: {$result}");
        }
        if (is_array($result) && isset($result['documentation_url'])) {
            throw new AppException("Error returned by Github REST API: {$result['status']} - {$result['message']}");
        }

        return $result;
    }
}