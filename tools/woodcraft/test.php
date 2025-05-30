<?php

$text = <<<MSX
Line 1
Line 2
Line 3
Line 4
Line 5
Line 6
Line 7
Line 8
Line 9
Line 10
MSX;

echo json_encode($text);
/*
$patch = <<<MSX
@@ -1,10 +1,11 @@
+--- Title here
 Line 1
 Line 2
-Line 3
-Line 4
-Line 5
 Line 6
+New line here!
+And another one
 Line 7
-Line 8
-Line 9
+Line 8, but modified
+Line 9, modified too
 Line 10
+--- The end!
MSX;
*/

$patch = <<<MSX
@@ -1,10 +1,15 @@
+--- Title
 Line 1
-Line 2
-Line 3
-Line 4
+Line 4 !
+aaa
+bbb
+ccc
+ddd
+eee
+fff
+ggg
 Line 5
-Line 6
-Line 7
+Line 7 ?
 Line 8
-Line 9
-Line 10
+--- Aaand...
+--- The end!
MSX;

echo apply_diff($text, $patch);
return;


echo apply_diff(file_get_contents("/home/konamiman/woocommercek/plugins/woocommerce/woocommerce.php"),
/*
<<<MSX
@@ -47,6 +47,10 @@ function WC() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.Fu
        return WooCommerce::instance();
 }
 
+// Add me.
+// Add me too.
+// QUE ME ADDES.
+
 /**
  * Returns the WooCommerce object container.
  * Code in the `includes` directory should use the container to get instances of classes in the `src` directory.
@@ -59,7 +63,7 @@ function wc_get_container() {
 }
 
 // Global for backwards compatibility.
-Thecosa;
+Thecosa, Modified!
 
 // Jetpack's Rest_Authentication needs to be initialized even before plugins_loaded.
 if ( class_exists( \Automattic\Jetpack\Connection\Rest_Authentication::class ) ) {
@@ -68,3 +72,4 @@ if ( class_exists( \Automattic\Jetpack\Connection\Rest_Authentication::class ) )
 
 // Foobar!
 // ...and fizzbuzz.
+// Yeah!
MSX);
*/
patch: <<<MSX
@@ -68,3 +68,5 @@ if ( class_exists( \Automattic\Jetpack\Connection\Rest_Authentication::class ) )

 // Foobar!
 // ...and fizzbuzz.
+//Lee lee.
+//Laa laa.
MSX);

return;

echo "--- Add metadata\n";
$text = "Hello, a text!\nBlah blah\n";

$text = update_metadata($text, ['foo'=>34]);
echo $text . "\n";

echo "--- Accidentally add metadata again\n";

$text = "<-- !metadata\nDon't delete or modify this comment manually!\n{ooops!}\n-->\n{$text}";
$text = update_metadata($text, ['foo'=>34, 'bar'=>89]);
echo $text . "\n";

echo "--- Extract metadata\n";

$data = extract_metadata($text);
var_dump($data);

echo "--- Delete metadata\n";
$text = update_metadata($text, []);
echo $text . "\n";

echo "--- Extract non existing metadata\n";

$data = extract_metadata($text);
var_dump($data);



function extract_metadata(string $text): ?array {
    $regex = '/^(?<all>\s*\<--\s* \!metadata[^{]*\{(?<json>.+)\}\s*--\>\s*)/mi';
    $regex_output = [];
    preg_match_all($regex, $text, $regex_output);
    $json = $regex_output['json'][0] ?? null;
    if(is_null($json)) {
        return [];
    }

    return json_decode('{' . $json . '}', true);
}

function update_metadata(string $text, array $metadata): string {
    $regex = '/^(?<all>\s*\<--\s* \!metadata[^{]*\{(?<json>.+)\}\s*--\>\s*)/mi';
    $text = preg_replace($regex, '', $text);
    if(empty($metadata)) {
        return $text;
    }
    $json = json_encode($metadata);
    return "<-- !metadata\nDon't delete or modify this comment manually!\n{$json}\n-->\n{$text}";
}

/**
 * Apply a diff to a text composed of multiple lines.
 * 
 * The diff is expected to be in unified format (https://www.gnu.org/software/diffutils/manual/html_node/Unified-Format.html)
 * but for a single file (so there are no file names and the first line starts with "@@" already).
 * 
 * The approach followed is probably not the most efficient possible, but the code is small and gets the job done.
 * 
 * @param string $contents The contents to apply the diff to.
 * @param string $diff The unified diff for the file.
 * @return string The contents with the diff applied.
 */
function apply_diff(string $contents, string $diff): string {
    $diff_lines = explode("\n", $diff);
    $added_lines = []; // line number => array of line contents
    $removed_line_numbers = [];
    foreach($diff_lines as $line) {
        if($line === '') {
            $line = ' ';
        }

        if($line[0] === '@') {
            preg_match('/-(?<original_line_number>\d+),/m', $line, $matches);
            $original_content_line_number = $matches['original_line_number'];
        }
        elseif($line[0] === '-') {
            $removed_line_numbers[] = $original_content_line_number;
            $original_content_line_number++;
        }
        elseif($line[0] === '+') {
            $added_lines[$original_content_line_number][] = substr($line, 1);
        }
        else {
            $original_content_line_number++;
        }
    }

    $new_content_lines = [];
    $current_line_number = 1;
    $original_content_lines = explode("\n", $contents);
    $max_original_content_line_number = count($original_content_lines);
    $max_line_number = max(array_merge([$max_original_content_line_number], $removed_line_numbers, array_keys($added_lines)));

    while($current_line_number <= $max_line_number) {
        $to_add = $added_lines[$current_line_number] ?? [];
        foreach($to_add as $line) {
            $new_content_lines[] = $line;
        }

        if($current_line_number <= $max_original_content_line_number && !in_array($current_line_number, $removed_line_numbers)) {
            $new_content_lines[] = $original_content_lines[$current_line_number-1];
        }

        $current_line_number++;
    }

    return implode("\n", $new_content_lines) . "\n";
}