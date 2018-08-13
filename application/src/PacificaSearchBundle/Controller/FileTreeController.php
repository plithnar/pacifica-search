<?php

namespace PacificaSearchBundle\Controller;

use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Model\Instrument;
use PacificaSearchBundle\Repository\FileRepository;
use Symfony\Component\HttpFoundation\Response;
use FOS\RestBundle\View\View;
use PacificaSearchBundle\Repository\InstitutionRepository;
use PacificaSearchBundle\Repository\InstrumentRepository;
use PacificaSearchBundle\Repository\InstrumentTypeRepository;
use PacificaSearchBundle\Repository\ProposalRepository;
use PacificaSearchBundle\Repository\TransactionRepositoryInterface;
use PacificaSearchBundle\Repository\UserRepository;
use Symfony\Component\HttpFoundation\Request;
use DateTimeZone;
use DateTime;

/**
 * Class FileTreeController
 *
 * Generates JSON used to construct the file tree used by the GUI
 */
class FileTreeController extends BaseRestController
{
    // Number of Proposals to include in one page of the file tree
    const PAGE_SIZE = 30;

    /** @var FileRepository */
    protected $fileRepository;

    /** @string */
    protected $metadataHost;

    public function __construct(
        InstitutionRepository $institutionRepository,
        InstrumentRepository $instrumentRepository,
        InstrumentTypeRepository $instrumentTypeRepository,
        ProposalRepository $proposalRepository,
        UserRepository $userRepository,
        TransactionRepositoryInterface $transactionRepository,
        FileRepository $fileRepository,
        String $metadataHost
    ) {
        parent::__construct(
            $institutionRepository,
            $instrumentRepository,
            $instrumentTypeRepository,
            $proposalRepository,
            $userRepository,
            $transactionRepository
        );

        $this->fileRepository = $fileRepository;
        $this->metadataHost = $metadataHost;
    }

    /**
     * Gets the top level of the tree (everything excluding the files, which have to be lazy-loaded on a per-transaction
     * basis). Pagination is done at the level of Proposals, so we limit the number of Proposals returned but return all
     * children of any Proposals in the page.
     *
     * The response is formatted like this:
     * [
     *     {
     *         "title": "Proposal #31390",
     *         "key": "31390",
     *         "folder": true,
     *         "children": [
     *             {
     *                 "title": "TOF-SIMS 2007 (Instrument ID: 34073)",
     *                 "key": "34073",
     *                 "folder": true,
     *                 "children": [
     *                     {
     *                         "title": "Files Uploaded 2017-01-02 (Transaction 37778)",
     *                         "key": "37778",
     *                         "folder": true,
     *                         "lazy": true
     *                     }, ... ( More transactions )
     *                 ]
     *             }, ... ( More instruments )
     *         ]
     *     }, ... ( More proposals )
     * ]
     *  {
     *
     *
     * This gives a directory hierarchy like this:
     *
     * Root directory
     *   |-- Proposal #31390
     *     |-- TOF-SIMS 2007 (Instrument ID: 34073)
     *       |-- Files Uploaded 2017-01-02 (Transaction 37778)
     *         |-- (Contents of this folder are the actual files, which are lazy loaded)
     *
     *
     * @param int $pageNumber
     * @param Request $request
     * @return Response
     */
    public function postPageAction($pageNumber, Request $request) 
    {
        if ($pageNumber < 1 || intval($pageNumber) != $pageNumber) {
            return $this->handleView(View::create([]));
        }

        $filter = Filter::fromRequest($request);
        if ($filter->isEmpty()) {
            // Without a filter we do not show a file tree - the result set would be too large to handle in any case
            return $this->handleView(View::create([]));
        }

        $transactions = $this->transactionRepository->getAssocArrayByFilter($filter);
        if (count($transactions) === 0) {
            return $this->handleView(View::create([]));
        }
        $response = [];
        $instrumentIds = [];
        foreach ($transactions as $transaction) {
            $instruments = $transaction['_source']['instruments'];
            foreach($instruments as $instrument) {
                $instrumentId = $instrument['obj_id'];
                $instrumentIds[$instrumentId] = $instrumentId;
            }
        }

        $instrumentCollection = $this->instrumentRepository->getById($instrumentIds);
        $instrumentNames = [];
        foreach ($instrumentCollection->getInstances() as $instrument) {
            /** @var $instrument Instrument */
            $instrumentNames[$instrument->getId()] = $instrument->getDisplayName();
        }

        foreach ($transactions as $transaction) {
            $proposalId = $transaction['_source']['proposals'][0]['obj_id'];
            $instrumentId = $transaction['_source']['instruments'][0]['obj_id'];
            $transactionId = $transaction['_id'];

            // TODO: This outermost array_key_exists() check is necessary because we are artificially limiting the
            // transactions we handle to 1000 - see Respository::getIdsByTransactionIds(). We need to remove that
            // limitation, and once we have we can remove the check
            if (!array_key_exists($proposalId, $response)) {
                $response[$proposalId] = [
                    'title' => "Proposal #$proposalId",
                    'key' => $proposalId,
                    'folder' => true,
                    'children' => []
                ];
            }
            if (array_key_exists($proposalId, $response)) {
                if (!array_key_exists($instrumentId, $response[$proposalId]['children'])) {
                    $instrumentName = $instrumentNames[$instrumentId];
                    $response[$proposalId]['children'][$instrumentId] = [
                        'title' => "$instrumentName (Instrument ID: $instrumentId)",
                        'key' => $instrumentId,
                        'folder' => true,
                        'children' => []
                    ];
                }
                $transNumId = explode('_', $transactionId);
                $transNumId = $transNumId[1];
                $response[$proposalId]['children'][$instrumentId]['children'][] = [
//                    'title' => "Files uploaded (<a href='http://status.local/view/$transactionId'>Transaction $transactionId</a>)",
                    'title' => "Files uploaded (<a href='$this->metadataHost/transactioninfo/by_id/$transNumId'>Transaction $transNumId</a>)",
                    'key' => $transNumId,
                    'folder' => true,
                    'lazy' => true
                ];
            }


            $instrumentIdsToTransactionIds[$transaction['_source']['instruments'][0]['obj_id']][] = $transaction['_id'];
        }

        // We use ID values above to make it easier to refer to specific records in code - for items that are meant to
        // be arrays rather than hashes in the produced JSON, we have to strip those out
        $response = array_values($response);
        foreach ($response as &$proposal) {
            $proposal['children'] = array_values($proposal['children']);
        }

        return $this->handleView(View::create($response));
    }

    /**
     * Fetches the contents of a single file folder for the purpose of lazy-loading those folders on demand.
     * The response is formatted like
     *
     * [
     *     {
     *     "fullpath": "<full path to file if a file, current fullpath otherwise>",
     *     "title": "<subdir name if in subdir, filename otherwise>",
     *     "key": "<file id if file, otherwise this key is absent>",
     *     "folder": <true if not a file, otherwise this key is absent>,
     *     "children": [
     *         ...next layer of folder structure until we hit a file or files
     *     ]
     *     }, ... ( More file definitions )
     * ]
     *
     * @param int $transactionId
     * @return Response
     */
    public function getTransactionFilesAction($transactionId)// : Response
    {
        if ($transactionId < 1 || intval($transactionId) != $transactionId) {
            return $this->handleView(View::create([]));
        }

        $directories = [];
        $files = $this->fileRepository->getByTransactionId($transactionId);
        foreach ($files->getInstances() as $file) {
            $filePathParts = explode('/', $file->getDisplayName());
            $this->addToDirectoryStructure($directories, $filePathParts, $file->getId());
        }

        $ch = curl_init();
        curl_setopt( $ch, CURLOPT_URL, "$this->metadataHost/transactioninfo/by_id/$transactionId" );
        curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
        $content = json_decode(curl_exec( $ch ), true);
        curl_close ( $ch );

        $treelist = $this->format_folder_to_tree($content['files']);
        $response = $this->format_folder_object_json($treelist['treelist'], 'test');
        return $this->handleView(View::create($response));
    }

    private function addToDirectoryStructure(array &$directory, array &$nodes, $fileId)
    {
        $node = array_shift($nodes);
        if (strlen($node) === 0) { // Ignore nodes without a name
            $this->addToDirectoryStructure($directory, $nodes, $fileId);
        } elseif (count($nodes)) { // $node is a directory: recurse
            if (!array_key_exists($node, $directory)) {
                $directory[$node] = [];
            }
            $this->addToDirectoryStructure($directory[$node], $nodes, $fileId);
        } else { // $node is a file
            $directory[] = $node . "_*_ID_*_$fileId";
        }
    }

    private function format_folder_to_tree($results, $folder_name = "")
    {
        $dirs = array();
        $file_list = array();
        foreach ($results as $item_id => $item_info) {
            $subdir = trim($item_info['subdir'], '/');
            $filename = $item_info['name'];
            $path = !empty($subdir) ? "{$subdir}/{$filename}" : $filename;
            $path_array = explode('/', $path);
            $file_list[$path] = $item_id;
        }
        ksort($file_list);
        $temp_list = array_keys($file_list);
        $first_path = array_shift($temp_list);
        $temp_list = array_keys($file_list);
        $last_path = array_pop($temp_list);
        $common_path_prefix_array = $this->get_common_path_prefix($first_path, $last_path);
        $common_path_prefix = implode('/', $common_path_prefix_array);
        foreach ($file_list as $path => $item_id) {
            $item_info = $results[$item_id];
            $path = ltrim(preg_replace('/^' . preg_quote($common_path_prefix, '/') . '/', '', $path), '/');
            $item_info['subdir'] = $path;
            $path_array = explode('/', $path);
            $this->build_folder_structure($dirs, $path_array, $item_info);
        }
        return array(
            'treelist' => $dirs,
            'files' => $results,
            'common_path_prefix_array' => $common_path_prefix_array
        );
    }

    /**
     *  Construct an array of folders that can be translated to
     *  a JSON object
     *
     *  @param array  $folder_obj  container for folders
     *  @param string $folder_name display name for the folder object
     *
     *  @return array
     *
     *  @author Ken Auberry <kenneth.auberry@pnnl.gov>
     */
    private function format_folder_object_json($folder_obj, $folder_name)
    {
        $output = array();
        if (array_key_exists('folders', $folder_obj)) {
            foreach ($folder_obj['folders'] as $folder_entry => $folder_tree) {
                $folder_output = array('title' => $folder_entry, 'folder' => true);
                $children = $this->format_folder_object_json($folder_tree, $folder_entry);
                if (!empty($children)) {
                    foreach ($children as $child) {
                        $folder_output['children'][] = $child;
                    }
                }
                $output[] = $folder_output;
            }
        }
        if (array_key_exists('files', $folder_obj)) {
            foreach ($folder_obj['files'] as $item_id => $file_entry) {
                $output[] = array('title' => $file_entry, 'key' => "ft_item_{$item_id}");
            }
        }
        return $output;
    }

    /**
     * Get the common directory prefix for a set of paths so that we can remove it.
     *
     * @param  string $first_path first path to compare
     * @param  string $last_path second path to compare
     * @param  string $delimiter path delimiter (defaults to '/')
     *
     * @return array array of common path elements
     *
     * @author Ken Auberry <kenneth.auberry@pnnl.gov>
     */
    private function get_common_path_prefix($first_path, $last_path, $delimiter = '/')
    {
        $first_path_array = explode($delimiter, dirname($first_path));
        $last_path_array = explode($delimiter, dirname($last_path));
        $short_path_array = count($first_path_array) < count($last_path_array) ? $first_path_array : $last_path_array;
        $longest_path_array = $short_path_array == $first_path_array ? $last_path_array : $first_path_array;
        $common_path_array = array();
        for ($i=0; $i<count($short_path_array); $i++) {
            if ($short_path_array[$i] == $longest_path_array[$i]) {
                $common_path_array[] = $short_path_array[$i];
            } else {
                break;
            }
        }
        return $common_path_array;
    }

    /**
     *  Recursively construct the proper HTML
     *  for representing a folder full of items
     *
     *  @param array $dirs       array of directory objects to process
     *  @param array $path_array path components in array form
     *  @param array $item_info  metadata about each item
     *
     *  @return void
     *
     *  @author Ken Auberry <kenneth.auberry@pnnl.gov>
     */
    private function build_folder_structure(&$dirs, $path_array, $item_info)
    {
        if (count($path_array) > 1) {
            if (!isset($dirs['folders'][$path_array[0]])) {
                $dirs['folders'][$path_array[0]] = array();
            }
            $this->build_folder_structure($dirs['folders'][$path_array[0]], array_splice($path_array, 1), $item_info);
        } else {
            $size_string = $this->format_bytes($item_info['size']);
            $date_string = $this->utc_to_local_time($item_info['mtime'], 'n/j/Y g:ia T');
            $item_id = $item_info['_id'];
            $hashsum = $item_info['hashsum'];
            $url = "'test{$this->metadataHost}/files/sha1/{$hashsum}";
            $item_info['url'] = $url;
            $item_info_json = json_encode($item_info);
            $fineprint = "[File Size: {$size_string}; Last Modified: {$date_string}]";
            $dirs['files'][$item_id] = "<a class='item_link' title='{$fineprint}' id='item_{$item_id}' href='{$url}'>{$path_array[0]}</a> <span class='fineprint'>{$fineprint}</span><span class='item_data_json' id='item_id_{$item_id}' style='display:none;'>{$item_info_json}</span>";
        }
    }

    private function format_bytes($bytes)
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        } elseif ($bytes < 1048576) {
            return round($bytes / 1024, 0).' KB';
        } elseif ($bytes < 1073741824) {
            return round($bytes / 1048576, 1).' MB';
        } elseif ($bytes < 1099511627776) {
            return round($bytes / 1073741824, 2).' GB';
        } else {
            return round($bytes / 1099511627776, 2).' TB';
        }
    }

    /**
     * Convert UTC to local time for end user display
     *
     * @param string $time          a strtotime parseable datetime string
     * @param string $string_format Output format for the new timestring
     *
     * @return string new timestring in local timezone time
     *
     * @author Ken Auberry <kenneth.auberry@pnnl.gov>
     */
    private function utc_to_local_time($time, $string_format = false)
    {
        $tz_local = new DateTimeZone('America/Los_Angeles');
        $tz_utc = new DateTimeZone('UTC');
        if (is_string($time) && strtotime($time)) {
            $time = new DateTime($time, $tz_utc);
        }
        if (is_a($time, 'DateTime')) {
            $time->setTimeZone($tz_local);
        }
        if ($string_format) {
            $time = $time->format($string_format);
        }
        return $time;
    }
}
