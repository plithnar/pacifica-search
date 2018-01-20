<?php

namespace Pacifica\Search\Tests\Repository;

require_once(__DIR__ . '/../Service/MockRepositoryManager.php');

use Pacifica\Search\Tests\TestCase;
use PacificaSearchBundle\Filter;
use PacificaSearchBundle\Repository\FileRepository;
use PacificaSearchBundle\Service\ElasticSearchQueryBuilder;
use PacificaSearchBundle\Service\SearchService;

class FileRepositoryTest extends TestCase
{
    /** @var SearchService (mocked) */
    protected $mockSearchService;

    /** @var MockRepositoryManager */
    protected $mockRepositoryManager;

    /** @var ElasticSearchQueryBuilder */
    protected $mockQueryBuilder;

    /**
     * The unit under test
     * @var FileRepository
     */
    protected $repository;

    /**
     * @inheritdoc
     */
    public function setUp()
    {
        $this->mockSearchService = $this->getMockBuilder(SearchService::class)
            ->setConstructorArgs(['dummyHost', 'dummyIndex'])
            ->getMock();

        $this->mockQueryBuilder = $this->createMock(ElasticSearchQueryBuilder::class);

        $this->mockRepositoryManager = new MockRepositoryManager($this->mockSearchService, $this);

        $this->repository = new FileRepository(
            $this->mockSearchService,
            $this->mockRepositoryManager
        );
    }

    /**
     * @test
     */
    public function getFilteredIds()
    {
        $this->mockQueryBuilder->expects($this->once())->method('byId')->willReturn($this->mockQueryBuilder);
        $this->mockQueryBuilder->expects($this->once())->method('whereIn')->willReturn($this->mockQueryBuilder);
        $this->mockSearchService->expects($this->any())->method('getQueryBuilder')->willReturn($this->mockQueryBuilder);
        $this->mockSearchService->expects($this->once())->method('getResults')->willReturn([
            [ '_id' => 1 ],
            [ '_id' => 2 ],
            [ '_id' => 3 ]
        ]);

        /** @var Filter $filter */
        $filter = $this->createMock(Filter::class);

        // Given an empty filter, getFilteredIds should return NULL
        $this->assertEquals(0, $this->repository->getIdsThatMayBeAddedToFilter($filter));
    }
}