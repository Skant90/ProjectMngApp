<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('project_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('project_role', ['manager', 'member', 'guest'])->default('member');
            $table->boolean('can_view_all_tasks')->default(true);
            $table->boolean('can_add_tasks')->default(false);
            $table->boolean('can_upload_files')->default(true);
            $table->boolean('can_invite_users')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['project_id', 'user_id']);
            $table->index('project_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_members');
    }
};
