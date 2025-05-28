<?php

namespace Automattic\WooCommerce\Woodcraft;

use Symfony\Component\Console\Application as Symfonyapplication;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Automattic\WooCommerce\Woodcraft\AppException;

class App extends Symfonyapplication {
    public function doRun(InputInterface $input, OutputInterface $output): int {
        try {
            $this->setName("Woodcraft - the WooCommerce repository maintenance tool.");
            $this->setVersion(APP_VERSION);

            $this->addCommands($this->get_command_classes());

            exit(parent::doRun($input, $output));
        }
        catch(AppException $e) {
            $io = new SymfonyStyle($input, $output);
            $io->error($e->getMessage());
            exit(1);
        }
        catch(\Exception $e) {
            $io = new SymfonyStyle($input, $output);
            $io->error('Unexpected exceptiom, details below');
            $io->text($e);
            exit(1);
        }
    }

    private function get_command_classes(): array {
        //Important: this assumes no subdirectories are present!
        $command_files =  array_diff(scandir(__DIR__ . '/Cli/Commands'), array('..', '.'));
        $command_classes = array_map( static::class . '::filename_to_class_name', $command_files);
        return array_map(fn($class_name) => new $class_name(), $command_classes);
    }

    private static function filename_to_class_name($filename): string {
        return 'Automattic\\WooCommerce\\Woodcraft\\Cli\\Commands\\' . str_replace(".php", "", $filename);
    }
}