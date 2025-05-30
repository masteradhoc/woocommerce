<?php

namespace App\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\CommandLoader\CommandLoaderInterface;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Console\Attribute\AsCommand;

#[AutoconfigureTag('console.command')]
class CommandLoader implements CommandLoaderInterface
{
    private array $commands = [];

    public function __construct(
        private ContainerInterface $container
    ) {
        $this->loadCommands();
    }

    private function loadCommands(): void
    {
        // Get all services tagged with 'console.command'
        $commandServices = $this->container->findTaggedServiceIds('console.command');
        
        foreach ($commandServices as $id => $tags) {
            $command = $this->container->get($id);
            
            if (!$command instanceof Command) {
                continue;
            }

            // Get the AsCommand attribute
            $reflection = new \ReflectionClass($command);
            $attributes = $reflection->getAttributes(AsCommand::class);
            
            if (empty($attributes)) {
                continue;
            }

            $attribute = $attributes[0]->newInstance();
            $name = $attribute->name ?? $command->getName();
            
            if ($name) {
                $this->commands[$name] = $command;
            }
        }
    }

    public function get(string $name): Command
    {
        if (!isset($this->commands[$name])) {
            throw new \InvalidArgumentException(sprintf('Command "%s" does not exist.', $name));
        }

        return $this->commands[$name];
    }

    public function has(string $name): bool
    {
        return isset($this->commands[$name]);
    }

    public function getNames(): array
    {
        return array_keys($this->commands);
    }
} 