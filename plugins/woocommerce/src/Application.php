<?php

namespace App;

use App\Command\CommandLoader;
use Symfony\Component\Console\Application as BaseApplication;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\PhpFileLoader;
use Symfony\Component\Config\FileLocator;

class Application extends BaseApplication
{
    private ContainerBuilder $container;

    public function __construct()
    {
        parent::__construct('My Console Application', '1.0.0');
        
        $this->container = new ContainerBuilder();
        $this->loadContainer();
        
        // Set the command loader
        $this->setCommandLoader($this->container->get(CommandLoader::class));
    }

    private function loadContainer(): void
    {
        // Load services
        $loader = new PhpFileLoader($this->container, new FileLocator(__DIR__ . '/../config'));
        $loader->load('services.php');

        // Register commands as services
        $this->container->registerForAutoconfiguration(\Symfony\Component\Console\Command\Command::class)
            ->addTag('console.command');

        // Compile the container
        $this->container->compile();
    }
} 