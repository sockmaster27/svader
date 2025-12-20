<script>
    import { resolve } from "$app/paths";
</script>

<ol>
    <li><a href={resolve("/hello-world")}>Hello world</a></li>
    <li><a href={resolve("/remount")}>Remounting canvas</a></li>
    <li><a href={resolve("/oversized-canvas")}>Oversized canvas</a></li>
    <li>
        <a href={resolve("/landing-page-bubbles")}>Landing page with bubbles</a>
    </li>
    <li>
        <a href={resolve("/landing-page-halo")}>Landing page with a halo</a>
    </li>
    <li><a href={resolve("/slider")}>Slider component</a></li>
</ol>
