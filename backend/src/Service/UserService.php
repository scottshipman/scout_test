<?php

namespace App\Service;

use App\Document\User;
use App\Document\UserStatus;
use App\Dto\CreateUserDto;
use App\Dto\UpdateUserDto;
use App\Exception\DuplicateEmailException;
use App\Exception\UserNotFoundException;
use App\Exception\ValidationException;
use App\Repository\UserRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class UserService
{
    private const DEFAULT_LIMIT = 10;
    private const MAX_LIMIT = 100;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly ValidatorInterface $validator,
    ) {
    }

    /**
     * @return array{items: User[], meta: array{page: int, limit: int, total: int, totalPages: int}}
     */
    public function listUsers(int $page, int $limit): array
    {
        // Just clamping page/limit to sane values instead of erroring out.
        $page = max(1, $page);
        $limit = min(self::MAX_LIMIT, max(1, $limit ?: self::DEFAULT_LIMIT));

        $result = $this->userRepository->findPaginated($page, $limit);
        $total = $result['total'];

        return [
            'items' => $result['items'],
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $total > 0 ? (int) ceil($total / $limit) : 0,
            ],
        ];
    }

    public function getUser(string $id): User
    {
        $user = $this->userRepository->find($id);
        if (!$user instanceof User) {
            throw new UserNotFoundException($id);
        }

        return $user;
    }

    public function createUser(array $payload): User
    {
        // Validating the DTO rather than the User entity itself, so a bad
        // role/status value fails validation cleanly instead of erroring.
        $dto = CreateUserDto::fromArray($payload);
        $this->assertValid($dto);

        // Checking for an existing email up front so we can return a normal
        // 409 instead of a raw database error.
        if ($this->userRepository->findByEmail($dto->email) !== null) {
            throw new DuplicateEmailException($dto->email);
        }

        $user = new User();
        $user->setFirstName($dto->firstName);
        $user->setLastName($dto->lastName);
        $user->setEmail($dto->email);
        $user->setRole($dto->role);
        // Defaulting new users to "pending" if no status is given.
        $user->setStatus($dto->status ?? UserStatus::Pending);

        $this->userRepository->save($user);

        return $user;
    }

    public function updateUser(string $id, array $payload): User
    {
        $user = $this->getUser($id);
        $dto = UpdateUserDto::fromArray($payload);
        $this->assertValid($dto);

        // Only check for duplicates if the email is actually changing.
        if ($dto->email !== null && strtolower($dto->email) !== $user->getEmail()) {
            $existing = $this->userRepository->findByEmail($dto->email);
            if ($existing !== null && $existing->getId() !== $user->getId()) {
                throw new DuplicateEmailException($dto->email);
            }
        }

        // Treating PUT as a partial update - only fields sent in the request
        // actually get changed, everything else is left alone.
        if ($dto->firstName !== null) {
            $user->setFirstName($dto->firstName);
        }
        if ($dto->lastName !== null) {
            $user->setLastName($dto->lastName);
        }
        if ($dto->email !== null) {
            $user->setEmail($dto->email);
        }
        if ($dto->roleProvided && $dto->role !== null) {
            $user->setRole($dto->role);
        }
        if ($dto->statusProvided && $dto->status !== null) {
            $user->setStatus($dto->status);
        }

        $this->userRepository->save($user);

        return $user;
    }

    public function deleteUser(string $id): void
    {
        $user = $this->getUser($id);
        $this->userRepository->remove($user);
    }

    private function assertValid(object $dto): void
    {
        $violations = $this->validator->validate($dto);
        if (count($violations) > 0) {
            throw new ValidationException($violations);
        }
    }
}
