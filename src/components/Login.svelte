<style>
.bg{
    background: #ffffff;
}
</style>
<script>
let username='';
let pwd='';
let repwd='';
let isPasswordMatch=false;
let isSignup=false;
(pwd === repwd)?isPasswordMatch=true:isPasswordMatch=false;

function signUp() {
    return isSignup=!isSignup;
}

function login(){

}
function validatePwd(){
    
}

</script>

<div class="w-full max-w-sm mx-auto mt-64">

  <form class="px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">

    <div class="mb-4">
      <label class="block mb-2 text-sm font-bold text-gray-700" for="username">
        Username
      </label>
      <input bind:value={username} class="w-full px-3 py-2 leading-tight text-gray-700 border rounded-full shadow appearance-none focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Username">
    </div>

    <div class="mb-6">
      <label class="block mb-2 text-sm font-bold text-gray-700" for="password">
        Password
      </label>
      <!-- border border-red-500 -->
      <input class="w-full px-3 py-2 mb-3 leading-tight text-gray-700 border rounded-full shadow appearance-none focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************">
      <p class="text-xs italic text-red-500">Please enter a password.</p>
    </div>
    {#if isSignup}
    <div class="mb-6">
      <label class="block mb-2 text-sm font-bold text-gray-700" for="password">
       Re-enter Password
      </label>
      <!-- border border-red-500 -->
      <input class="w-full px-3 py-2 mb-3 leading-tight text-gray-700 border rounded-full shadow appearance-none focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************">
      <p class="text-xs italic text-red-500">Please enter a password.</p>
    </div>
       {/if}
    <div class="flex items-center justify-between">
    <div class="w-full">
      <button class="w-full px-4 py-2 mb-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline" type="button"  on:click={login}>
        Sign In
      </button>
      <a class="inline-block text-sm font-bold text-blue-500 align-baseline hover:text-blue-800" on:click={signUp} href="#/">
        Create Account
      </a>
    </div>
    </div>

  </form>

  <p class="text-xs text-center text-gray-500">
    &copy;2020 doer Corp. All rights reserved.
  </p>

</div>