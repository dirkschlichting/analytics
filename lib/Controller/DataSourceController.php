<?php
/**
 * Analytics
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the LICENSE.md file.
 *
 * @author Marcel Scherello <audioplayer@scherello.de>
 * @copyright 2020 Marcel Scherello
 */

namespace OCA\Analytics\Controller;

use OCA\Analytics\Datasource\DatasourceEvent;
use OCA\Analytics\Datasource\ExternalFile;
use OCA\Analytics\Datasource\File;
use OCA\Analytics\Datasource\Github;
use OCA\Analytics\Datasource\Json;
use OCA\Analytics\Datasource\Regex;
use OCP\AppFramework\Controller;
use OCP\EventDispatcher\IEventDispatcher;
use OCP\Files\NotFoundException;
use OCP\IL10N;
use OCP\ILogger;
use OCP\IRequest;

class DataSourceController extends Controller
{
    private $logger;
    private $GithubService;
    private $FileService;
    private $ExternalFileService;
    private $RegexService;
    private $JsonService;
    private $userId;
    /** @var IEventDispatcher */
    protected $dispatcher;
    private $l10n;

    const DATASET_TYPE_GROUP = 0;
    const DATASET_TYPE_INTERNAL_FILE = 1;
    const DATASET_TYPE_INTERNAL_DB = 2;
    const DATASET_TYPE_GIT = 3;
    const DATASET_TYPE_EXTERNAL_FILE = 4;
    const DATASET_TYPE_REGEX = 5;
    const DATASET_TYPE_JSON = 6;

    public function __construct(
        string $AppName,
        IRequest $request,
        $userId,
        ILogger $logger,
        Github $GithubService,
        File $FileService,
        Regex $RegexService,
        Json $JsonService,
        ExternalFile $ExternalFileService,
        IL10N $l10n,
        IEventDispatcher $dispatcher
    )
    {
        parent::__construct($AppName, $request);
        $this->userId = $userId;
        $this->logger = $logger;
        $this->ExternalFileService = $ExternalFileService;
        $this->GithubService = $GithubService;
        $this->RegexService = $RegexService;
        $this->FileService = $FileService;
        $this->JsonService = $JsonService;
        $this->dispatcher = $dispatcher;
        $this->l10n = $l10n;
    }

    /**
     * get all datasource ids + names
     *
     * @NoAdminRequired
     */
    public function index()
    {
        $result = array();
        foreach ($this->getDatasources() as $key => $class) {
            $result[$key] = $class->getName();
        }
        return $result;
    }

    /**
     * get all datasource templates
     *
     * @NoAdminRequired
     * @return array
     */
    public function getTemplates()
    {
        $result = array();
        foreach ($this->getDatasources() as $key => $class) {
            $result[$key] = $class->getTemplate();
        }
        return $result;
    }

    /**
     * Get the data from a datasource;
     *
     * @NoAdminRequired
     * @param int $datasourceId
     * @param $option
     * @return array|NotFoundException
     */
    public function read(int $datasourceId, $option)
    {
        //$this->logger->debug('DataSourceController 66: Datasource Id: ' . $datasource . ', Option: ' . json_encode($option));
        return $this->getDatasources()[$datasourceId]->readData($option);
    }

    /**
     * combine internal and registered datasources
     * @return array
     */
    private function getDatasources()
    {
        return $this->getOwnDatasources() + $this->getRegisteredDatasources();
    }

    /**
     * map all internal datasources to their IDs
     * @return array
     */
    private function getOwnDatasources()
    {
        $datasources = [];
        $datasources[self::DATASET_TYPE_INTERNAL_FILE] = $this->FileService;
        $datasources[self::DATASET_TYPE_GIT] = $this->GithubService;
        $datasources[self::DATASET_TYPE_EXTERNAL_FILE] = $this->ExternalFileService;
        $datasources[self::DATASET_TYPE_REGEX] = $this->RegexService;
        $datasources[self::DATASET_TYPE_JSON] = $this->JsonService;
        return $datasources;
    }

    /**
     * map all registered datasources to their IDs
     * @return array
     */
    private function getRegisteredDatasources()
    {
        $datasources = [];
        $event = new DatasourceEvent();
        $this->dispatcher->dispatchTyped($event);

        foreach ($event->getDataSources() as $class) {
            $uniqueId = '99' . \OC::$server->get($class)->getId();

            if (isset($datasources[$uniqueId])) {
                $this->logger->logException(new \InvalidArgumentException('Datasource with the same ID already registered: ' . \OC::$server->get($class)->getName()), ['level' => ILogger::INFO]);
                continue;
            }
            $datasources[$uniqueId] = \OC::$server->get($class);
        }
        return $datasources;
    }
}