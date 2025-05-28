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


#[AsCommand(
    name: 'test',
    description: 'Test for the Symfony console component.',
    hidden: true
)]
class Test extends Command {

    public function __invoke(
        SymfonyStyle $io,
        InputInterface $in,
        OutputInterface $out,
         #[Argument(name: 'foobar', suggestedValues: ['a', 'b', 'c'], description: 'The foobar itself')] string $identifier='foo',
         #[Option(name: 'the_opt', description: 'a desc', shortcut: 'act')] bool $activate = false
    ): int {
        //$in = new ArgvInput();
        //$io = new SymfonyStyle(new ArgvInput(), new ConsoleOutput());

        $io->title("The tiiitleee");
        $io->section("A section");

        echo "Verbosity: " . $io->getVerbosity() . "\n";

        $io->block("The foo", "The bar", "The talcual", "andm modre");
        $io->listing(["One", "two", "three"]);
        $io->text(["One text", "two", "three"]);

        $io->comment("A comment.");
        $io->success("A success.");
        $io->error("A error.");
        $io->warning("A warning.");
        $io->note("A note.");

        $io->info("A info.");
        $io->caution("A caution.");

        $io->writeLn("<comment>comment</comment>, <info>success</info>, <question>question</question>, <error>error</error>");

        $io->table(["name", "type", "size"], [["Foo", "guay", 34], ["Bar", "meh", 89]]);
        $io->horizontalTable(["name", "type", "size"], [["Foo", "guay", 34], ["Bar", "meh", 89]]);

        $io->definitionList("The foobar", ["a"=>"b"], new TableSeparator(), ["c" => "d"]);

        $s = $out->section("x");
        $s->writeln("a");
        $io->progressStart(34);
        $io->progressAdvance();
        for($i=0; $i<34; $i++) {
            $s->overwrite($i);
            $io->progressAdvance();
            sleep(1);            
        }
        $io->progressFinish();

        return Command::SUCCESS;
    }
}

/*

https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&slug=woocommerce

{
  "version": "9.8.5",
  ...
  "versions": {
    "3.0.0": "https://downloads.wordpress.org/plugin/woocommerce.3.0.0.zip",
    "3.0.1": "https://downloads.wordpress.org/plugin/woocommerce.3.0.1.zip",
    ...
    "9.8.5": "https://downloads.wordpress.org/plugin/woocommerce.9.8.5.zip",
    "9.9.0-beta.1": "https://downloads.wordpress.org/plugin/woocommerce.9.9.0-beta.1.zip",
    "9.9.0-rc.1": "https://downloads.wordpress.org/plugin/woocommerce.9.9.0-rc.1.zip",
    "trunk": "https://downloads.wordpress.org/plugin/woocommerce.zip"
  }

*/