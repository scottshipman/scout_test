<?php

namespace App\Repository;

use App\Document\User;
use Doctrine\Bundle\MongoDBBundle\ManagerRegistry;
use Doctrine\Bundle\MongoDBBundle\Repository\ServiceDocumentRepository;

/**
 * @extends ServiceDocumentRepository<User>
 */
class UserRepository extends ServiceDocumentRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function save(User $user): void
    {
        $dm = $this->getDocumentManager();
        $dm->persist($user);
        $dm->flush();
    }

    public function remove(User $user): void
    {
        $dm = $this->getDocumentManager();
        $dm->remove($user);
        $dm->flush();
    }

    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => strtolower($email)]);
    }

    /**
     * @return array{items: User[], total: int}
     */
    public function findPaginated(int $page, int $limit): array
    {
        $qb = $this->createQueryBuilder();

        $total = (clone $qb)->count()->getQuery()->execute();

        $items = $qb
            ->sort('createdAt', 'desc')
            ->skip(($page - 1) * $limit)
            ->limit($limit)
            ->getQuery()
            ->execute()
            ->toArray();

        return [
            'items' => array_values($items),
            'total' => $total,
        ];
    }
}
