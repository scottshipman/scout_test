<?php

namespace App\Document;

use App\Repository\UserRepository;
use Doctrine\ODM\MongoDB\Mapping\Attribute as MongoDB;
use Symfony\Component\Validator\Constraints as Assert;

#[MongoDB\Document(collection: 'users', repositoryClass: UserRepository::class)]
#[MongoDB\UniqueIndex(keys: ['email' => 1])]
#[MongoDB\HasLifecycleCallbacks]
class User
{
    #[MongoDB\Id]
    private ?string $id = null;

    #[MongoDB\Field(type: 'string')]
    #[Assert\NotBlank(message: 'First name is required.')]
    #[Assert\Length(max: 100)]
    private string $firstName = '';

    #[MongoDB\Field(type: 'string')]
    #[Assert\NotBlank(message: 'Last name is required.')]
    #[Assert\Length(max: 100)]
    private string $lastName = '';

    #[MongoDB\Field(type: 'string')]
    #[Assert\NotBlank(message: 'Email is required.')]
    #[Assert\Email(message: 'Please provide a valid email address.')]
    private string $email = '';

    #[MongoDB\Field(type: 'string', enumType: UserRole::class)]
    #[Assert\NotNull(message: 'Role is required.')]
    private UserRole $role = UserRole::User;

    #[MongoDB\Field(type: 'string', enumType: UserStatus::class)]
    #[Assert\NotNull(message: 'Status is required.')]
    private UserStatus $status = UserStatus::Pending;

    #[MongoDB\Field(type: 'date_immutable')]
    private \DateTimeImmutable $createdAt;

    #[MongoDB\Field(type: 'date_immutable')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[MongoDB\PreUpdate]
    public function touch(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = strtolower($email);

        return $this;
    }

    public function getRole(): UserRole
    {
        return $this->role;
    }

    public function setRole(UserRole $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function getStatus(): UserStatus
    {
        return $this->status;
    }

    public function setStatus(UserStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'firstName' => $this->firstName,
            'lastName' => $this->lastName,
            'email' => $this->email,
            'role' => $this->role->value,
            'status' => $this->status->value,
            'createdAt' => $this->createdAt->format(DATE_ATOM),
            'updatedAt' => $this->updatedAt->format(DATE_ATOM),
        ];
    }
}
