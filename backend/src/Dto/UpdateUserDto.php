<?php

namespace App\Dto;

use App\Document\UserRole;
use App\Document\UserStatus;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * All fields are optional; only the fields present in the request payload
 * are applied to the existing user (partial update semantics).
 */
class UpdateUserDto
{
    #[Assert\NotBlank(allowNull: true, message: 'First name cannot be blank.')]
    #[Assert\Length(max: 100)]
    public ?string $firstName = null;

    #[Assert\NotBlank(allowNull: true, message: 'Last name cannot be blank.')]
    #[Assert\Length(max: 100)]
    public ?string $lastName = null;

    #[Assert\NotBlank(allowNull: true, message: 'Email cannot be blank.')]
    #[Assert\Email(message: 'Please provide a valid email address.')]
    public ?string $email = null;

    #[Assert\Choice(callback: [UserRole::class, 'cases'], message: 'Role must be one of admin, manager, user.')]
    public ?UserRole $role = null;

    #[Assert\Choice(callback: [UserStatus::class, 'cases'], message: 'Status must be one of active, inactive, pending.')]
    public ?UserStatus $status = null;

    public bool $roleProvided = false;
    public bool $statusProvided = false;

    public static function fromArray(array $data): self
    {
        $dto = new self();

        if (array_key_exists('firstName', $data)) {
            $dto->firstName = trim((string) $data['firstName']);
        }
        if (array_key_exists('lastName', $data)) {
            $dto->lastName = trim((string) $data['lastName']);
        }
        if (array_key_exists('email', $data)) {
            $dto->email = trim((string) $data['email']);
        }
        if (array_key_exists('role', $data)) {
            $dto->roleProvided = true;
            $dto->role = is_string($data['role']) ? UserRole::tryFrom($data['role']) : null;
        }
        if (array_key_exists('status', $data)) {
            $dto->statusProvided = true;
            $dto->status = is_string($data['status']) ? UserStatus::tryFrom($data['status']) : null;
        }

        return $dto;
    }
}
