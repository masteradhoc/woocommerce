<?php

namespace Automattic\WooCommerce\Woodcraft\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Console\Helper\TableSeparator;
use Symfony\Component\Console\Input\ArgvInput;
use Symfony\Component\Console\Output\ConsoleOutput;
use Automattic\WooCommerce\Woodcraft\Config;
use Automattic\WooCommerce\Woodcraft\Cli\CommandBase;
use function Symfony\Component\String\u;


#[AsCommand(
    name: 'status',
    description: 'Display status for the WooCommerce repository and releases',
    hidden: false,
    help: <<<TXT
        Display status for the WooCommerce repository and releases.
        TXT
)]
class Status extends CommandBase {

    public function __invoke(
        SymfonyStyle $io,
        InputInterface $in,
        OutputInterface $out,
        #[Option(name: 'desc-max-length', shortcut: 'dml', description: 'Maximum length for description strings, 0 for unlimited')] int $description_max_length=80,
    ): int {
        if($description_max_length === 0) {
            $description_max_length = 100000;
        }

        $io->title("Repository status");

        // --- Milestones

        $io->section("Open milestones");

        $io->write("Retrieving the list of milestones... ");
        $milestones = $this->github_api_client->get_open_milestones();
        $io->writeLn("<info>Ok</info>\n");
        //$milestones[] = ['title' => '10.2.0', 'description' => null, 'dueOn' => null];
        //$milestones[] = ['title' => '10.3.0', 'description' => null, 'dueOn' => null];

        // Sort milestones by title descending
        usort($milestones, fn($m1,$m2) => version_compare($m2['title'], $m1['title']));

        if(empty($milestones)) {
            $io->warning("There are no open milestones at all. At least one for the future main version should exist.");
        }
        else {
            $milestones_for_table = array_map(fn($m) => [$m['title'], u($m['description'])->truncate($description_max_length, "..."), substr($m['dueOn'], 0, 10)], $milestones);
            $io->table(['Title', 'Description', 'Due date'], $milestones_for_table);
        }

        $future_main_version = null;
        $next_main_version = null;
        $more_than_two_main_versions = false;
        $maintenance_versions = [];

        foreach($milestones as $milestone) {
            $title = $milestone['title'];
            $is_main_version = str_ends_with($title, '.0');
            if(!$is_main_version) {
                $maintenance_versions[] = $title;
                continue;
            }

            if($future_main_version === null) {
                $future_main_version = $title;
            }
            else if($next_main_version === null) {
                $next_main_version = $title;
            }
            else {
                $more_than_two_main_versions = true;
                //$future_main_version = $next_main_version;
                //$next_main_version = $title;
            }
        }

        if($more_than_two_main_versions) {
            $io->warning("There are more than two open milestones for main versions. Only one or two should exist.\nThe determination of future and next main versions may be incorrect.");
        }
        else if(!$future_main_version && !empty($milestones)) {
            $io->warning("There are no open milestones for main versions. At least one for the future main version should exist.");
        }

        if($future_main_version) {
            $io->text("Future main version: " . $future_main_version);
        }
        if($next_main_version) {
            $io->text("Next main version: " . $next_main_version);        
        }

        return Command::SUCCESS;
    }
}