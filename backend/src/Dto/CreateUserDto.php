<?php

namespace App\Dto;

use App\Document\UserRole;
use App\Document\UserStatus;
use Symfony\Component\Validator\Constraints as Assert;

class CreateUserDto
{
    #[Assert\NotBlank(message: 'First name is required.')]
    #[Assert\Length(max: 100)]
    public string $firstName = '';

    #[Assert\NotBlank(message: 'Last name is required.')]
    #[Assert\Length(max: 100)]
    public string $lastName = '';

    #[Assert\NotBlank(message: 'Email is required.')]
    #[Assert\Email(message: 'Please provide a valid email address.')]
    public string $email = '';

    #[Assert\NotNull(message: 'Role is required.')]
    #[Assert\Choice(callback: [UserRole::class, 'cases'], message: 'Role must be one of admin, manager, user.')]
    public ?UserRole $role = null;

    #[Assert\Choice(callback: [UserStatus::class, 'cases'], message: 'Status must be one of active, inactive, pending.')]
    public ?UserStatus $status = null;

    public static function fromArray(array $data): self
    {
        $dto = new self();
        $dto->firstName = trim((string) ($data['firstName'] ?? ''));
        $dto->lastName = trim((string) ($data['lastName'] ?? ''));
        $dto->email = trim((string) ($data['email'] ?? ''));
        $dto->role = self::mapEnum(UserRole::class, $data['role'] ?? null);
        $dto->status = self::mapEnum(UserStatus::class, $data['status'] ?? null);

        return $dto;
    }

    /**
     * @template T of \BackedEnum
     * @param class-string<T> $enumClass
     * @return T|null
     */
    private static function mapEnum(string $enumClass, mixed $value): ?\BackedEnum
    {
        if (!is_string($value) || $value === '') {
            return null;
        }

        return $enumClass::tryFrom($value);
    }
}
