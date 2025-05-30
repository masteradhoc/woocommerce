<?php

use App\Command\CommandLoader;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

return function (ContainerConfigurator $container) {
    $container->services()
        ->defaults()
        ->autowire()
        ->autoconfigure()
        
        ->set(CommandLoader::class)
        ->public()
        
        // Register all commands in the Command directory
        ->load('App\\Command\\', '../src/Command/*')
        ->tag('console.command');
}; 