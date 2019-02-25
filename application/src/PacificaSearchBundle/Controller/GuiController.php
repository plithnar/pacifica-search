<?php

namespace PacificaSearchBundle\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Templating\EngineInterface;
use Requests;

class GuiController
{

    /** @string **/
    protected $elasticSearchHost;

    private $page_data = [
        'script_uris' => [
            'assets/js/lib/spinner/spin.min.js',
            'assets/js/lib/fancytree/dist/jquery.fancytree-all.js',
            'assets/js/lib/select2/dist/js/select2.js'
        ],
        'css_uris' => [
            'assets/js/lib/fancytree/dist/skin-lion/ui.fancytree.min.css',
            'assets/js/lib/select2/dist/css/select2.css',
            'assets/css/file_directory_styling.css',
            'assets/css/combined.css'
        ]
    ];

    private function get_user()
    {
        $md_url = $this->metadataHost;
        $remote_user = array_key_exists("REMOTE_USER", $_SERVER) ? $_SERVER["REMOTE_USER"] : false;
        $remote_user = !$remote_user && array_key_exists("PHP_AUTH_USER", $_SERVER) ? $_SERVER["PHP_AUTH_USER"] : $remote_user;
        $results = false;
        if ($remote_user) {
            //check for email address as username
            $selector = filter_var($remote_user, FILTER_VALIDATE_EMAIL) ? 'email_address' : 'network_id';
            $url_args_array = array(
                $selector => strtolower($remote_user)
            );
            $query_url = "{$md_url}/users?";
            $query_url .= http_build_query($url_args_array, '', '&');
            $query = Requests::get($query_url, array('Accept' => 'application/json'));
            $results_body = $query->body;
            $results_json = json_decode($results_body, true);
            if ($query->status_code == 200 && !empty($results_json)) {
                $resultJson = $results_json[0];
                if($resultJson) {
                    $results = sprintf('%s %s (%s)', 
                        $resultJson['first_name'], 
                        $resultJson['last_name'],
                        $resultJson['network_id'] ? $resultJson['network_id'] : $resultJson['email_address']
                    );
                }
            }
        }
        return $results;
    }

    public function __construct(
        $elasticSearchHost,
        $metadataHost,
        EngineInterface $renderingEngine
    ) {
        $this->renderingEngine = $renderingEngine;
        $this->elasticSearchHost = $elasticSearchHost;
        $this->metadataHost = $metadataHost;
    }

    /**
     * Renders the GUI of the Pacifica Search application
     * @return Response
     */
    public function indexAction() : Response
    {
        $renderedContent = $this->renderingEngine->render(
            'PacificaSearchBundle::search.html.twig',
            [
                'page_data' => $this->page_data,
                'elastic_search_host' => $this->elasticSearchHost,
                'user_string' => $this->get_user(),
            ]
        );

        return new Response($renderedContent);
    }
}
